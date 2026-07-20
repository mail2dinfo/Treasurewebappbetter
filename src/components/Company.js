import React, { useState, useEffect } from 'react';
import ReactFlagsSelect from "react-flags-select";
import "./flags.css";
import Alert from '../components/Alert';
import { API_BASE_URL } from '../utils/apiConfig';
import { useUserContext } from '../context/user_context';
import { uploadImage } from "../utils/uploadImage";
import AvatarUploader from '../components/AvatarUploader';


function Company() {
    const { user, updateUserCompany, userRole } = useUserContext();
    console.log(user);
    const [editMode, setEditMode] = useState(false);
    const [image, setImage] = useState('');
    const [formData, setFormData] = useState({
        companyName: '',
        companyLogo: '',
        registrationNo: '',
        tagLine: '',
        companySince: '',
        companyStreetAddress: '',
        city: '',
        state: '',
        country: '',
        zipcode: '',
        latitude: '',
        longitude: '',
        phone: '',
        email: '',
        countryCode: '',  // Default to 'auto'
        sourceSystem: 'WEB',
        companyId: '',
    });
    const [previewUrl, setPreviewUrl] = useState(image?.previewUrl || "https://i.imgur.com/ndu6pfe.png");
    const [, setErrorMessage] = useState('')
    const [selectedCountry, setSelectedCountry] = useState('IN');
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


    useEffect(() => {
        const defaultCountry = countries.find((c) => c.value === selectedCountry);
        if (defaultCountry) {
            setFormData((prevData) => ({
                ...prevData, // ✅ Preserve existing form data
                country: defaultCountry.label,
                countryCode: defaultCountry.countryCode,
            }));
        }

        console.log("We are from useEffect");
        console.log(defaultCountry?.label); // ✅ Logs the correct country
        console.log(defaultCountry?.countryCode); // ✅ Logs the correct countryCode
    }, [selectedCountry]); // ✅ Added `countries` and `setFormData` to dependencies
    useEffect(() => {
        console.log("FormData updated:", formData);
    }, [formData]);

    useEffect(() => {
        if (user?.results?.userCompany) {
            setEditMode(true);
            const companyData = user.results.userCompany;
            console.log('Kandrul');
            console.log(companyData);

            // Find the country object based on the country name from DB
            const countryObj = countries.find((c) => c.countryCode === companyData.country_code) || {};

            // ✅ Set all form data in one go to prevent overwrites
            setFormData(prev => ({
                ...prev,
                companyName: companyData.name || '',
                companyLogo: companyData.logo || '',
                tagLine: companyData.tagline || '',
                registrationNo: companyData.registration_no || '',
                companySince: companyData.company_since ? companyData.company_since.split('-')[0] : '',
                companyStreetAddress: companyData.street_address || '',
                city: companyData.city || '',
                state: companyData.state || '',
                country: companyData.country || '',
                countryCode: companyData.country_code || countryObj.countryCode || '',
                zipcode: companyData.zipcode || '',
                latitude: companyData.latitude || 0,
                longitude: companyData.longitude || 0,
                phone: companyData.phone || '',
                email: companyData.email || '',
                companyId: companyData.id || '',
                sourceSystem: 'WEB',
            }));

            // ✅ Set preview URL for company logo
            if (companyData.logo_s3_image) {
                setPreviewUrl(companyData.logo_s3_image);
            }

            // ✅ Ensure selected country is updated
            if (selectedCountry !== (countryObj.value || '')) {
                setSelectedCountry(countryObj.value || '');
            }
        } else {
            setEditMode(false); // Reset edit mode if no company data
            setFormData((prevData) => ({
                ...prevData, // ✅ Preserve previous values
                companyName: '',
                registrationNo: '',
                companyLogo: '',
                tagLine: '',
                companySince: '',
                companyStreetAddress: '',
                city: '',
                state: '',
                zipcode: '',
                latitude: 0,
                longitude: 0,
                phone: '',
                email: '',
                companyId: '',
                sourceSystem: 'WEB',
            }));
        }
    }, [user]); // Include countries in dependency array if needed







    const [, setSignupMessage] = useState('');
    const [membershipId] = useState(user.results.userAccounts[0]?.parent_membership_id
    );


    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // State for controlling loading bar

    const showSelectedLabel = true; // Change this to true or false based on your requirement
    const searchable = true;

    const [list] = useState([]);
    const [alert, setAlert] = useState({ show: false, msg: '', type: '' });







    const handleCountryChange = (value) => {
        setSelectedCountry(value);

        // Find the selected country object from the countries array
        const selectedCountryObj = countries.find((country) => country.value === value);
        console.log(value);
        console.log(selectedCountryObj);
        console.log(selectedCountryObj.label);
        console.log(selectedCountryObj.countryCode);
        if (selectedCountryObj) {
            // Reset the formData state with the country code and label from the selected country
            setFormData((prevData) => ({
                ...prevData,
                country: selectedCountryObj.label,
                countryCode: selectedCountryObj.countryCode,

            }));

        }
    };

    const handleSubmit = async (e) => {

        e.preventDefault();
        setIsLoading(true); // Show loading bar when data fetching starts




        try {
            console.log('Pannipaya');
            let companyLogoUrl = formData.companyLogo;
            console.log('companyLogoUrl', formData.companyLogo);
            console.log(formData.companyLogo);
            if (!editMode) {
                console.log('came to insert')
                companyLogoUrl = await uploadImage(image.file, API_BASE_URL, setErrorMessage)
            } else {
                console.log(image?.file)
                console.log('came to edit')
                if (image && typeof image === "object" && image.file) {
                    console.log('inside about to upload')
                    companyLogoUrl = await uploadImage(image.file, API_BASE_URL, setErrorMessage);
                }
                //         console.log('came to edit')
                // console.log('Original Image URL:', formData.companyLogo);


                // console.log('Selected Image:', image?.file);
                // console.log('step 1')


                // if (image?.file ) {

                //     console.log('step 2')

                //     console.log(image?.file)
                //     console.log(user?.results?.userCompany?.logo )

                //     const existingImageNumber = user?.results?.userCompany?.logo 
                //     ? extractImageNumber(user.results.userCompany.logo) 
                //     : "";
                //     console.log('Extracted Existing Image Number:', existingImageNumber);

                //     const newFileName = image.file.name;
                //     const newImageNumber = newFileName ? extractImageNumber(newFileName) : "";

                //     console.log('Extracted New Image Number:', newImageNumber);

                //     if (existingImageNumber !== newImageNumber) {
                //         console.log('Uploading new image...');
                //         // companyLogoUrl = await uploadImage(image.file, API_BASE_URL, setErrorMessage);
                //     } 

                // } else {
                //     console.log('No new image selected, preserving old image.');
                //     companyLogoUrl = user.results.userCompany.logo;
                // }
                // console.log('mani')
            }
            // Include membershipId in the formData
            const updatedFormData = {
                ...formData,
                membershipId: membershipId,
                companyLogo: companyLogoUrl,
            };

            const apiUrl = `${API_BASE_URL}/company`;
            const method = editMode ? 'PUT' : 'POST';
            const response = await fetch(apiUrl, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${user?.results?.token}`, // Include the Bearer token
                    'Content-Type': 'application/json',
                    'X-User-Role': userRole, // Include the user role in a custom header
                },
                body: JSON.stringify(updatedFormData),
            });

            const responseData = await response.json();
            if (response.ok) {


                // Assuming you have received the updated company data in the `responseData` from your API call
                const updatedUserCompanyData = responseData.results;

                console.log('Vakaoli');
                console.log(updatedUserCompanyData);
                // Use the `updateUserCompany` function from the user context to update the user's company data
                updateUserCompany(updatedUserCompanyData);

                // updateUserCompany(updatedUserCompanyData);
                showAlert(true, 'success', responseData.message);
            } else {

                // Handle error response        
                showAlert(true, 'danger', responseData.errors || responseData.message || "An error occurred");

            }
        } catch (error) {
            // Handle network or fetch error, update the message state
            setSignupMessage('An error occurred');
        } finally {
            setIsLoading(false); // Hide loading bar when data fetching is complete
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };




    const showAlert = (show = false, type = '', msg = '') => {
        console.log('hi');
        setAlert({ show, type, msg });
    };


    const handleCheckboxChange = (e) => {
        setAgreedToTerms(e.target.checked);
    };


    const requiredFields = [
        "phone", "email", "companyName", "tagLine", "companySince",
        "companyStreetAddress", "city", "state", "zipcode"
    ];
    const isButtonDisabled = !agreedToTerms || requiredFields.some(field => !formData[field]);





    const handleSetImage = (file) => {
        if (file) {
            const fileURL = URL.createObjectURL(file);
            setPreviewUrl(fileURL);
            setImage({ file, previewUrl: fileURL }); // ✅ Store both file & preview URL
            console.log('New image');
            console.log(file);
            console.log(fileURL);
            console.log(previewUrl);
            setFormData(prev => ({ ...prev, companyLogo: fileURL }));
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                        {editMode ? 'Edit Your' : 'Create New'} <span className="text-red-600">Company</span>
                    </h1>
                    <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-red-600 mx-auto rounded-full mb-6"></div>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        {editMode
                            ? 'Update your company information and keep your profile current.'
                            : 'Set up your company profile to get started with Treasure Chit Fund management.'
                        }
                    </p>
                </div>

                {/* Main Form Card */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <div className="p-8 md:p-12">
                        {/* Country Selection */}
                        <div className="mb-8">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Select Country
                            </label>
                            <div className="max-w-xs">
                                <ReactFlagsSelect
                                    selected={selectedCountry}
                                    onSelect={handleCountryChange}
                                    countries={countries.map((country) => country.value)}
                                    showSelectedLabel={showSelectedLabel}
                                    searchable={searchable}
                                />
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">


                            {/* Avatar Upload Section */}
                            <div className="text-center mb-8">
                                <label className="block text-sm font-semibold text-gray-700 mb-4">
                                    Company Logo
                                </label>
                                <AvatarUploader handleSetImage={handleSetImage} currentImage={previewUrl} />
                            </div>

                            {/* Form Grid */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Company Name */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Company Name *
                                    </label>
                                    <input
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                                        type="text"
                                        placeholder="Enter your company name"
                                        name="companyName"
                                        onChange={handleChange}
                                        value={formData.companyName}
                                    />
                                </div>

                                {/* Company Tagline */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Company Tagline *
                                    </label>
                                    <input
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                                        type="text"
                                        placeholder="Enter your company tagline"
                                        name="tagLine"
                                        onChange={handleChange}
                                        value={formData.tagLine}
                                    />
                                </div>

                                {/* Registration No */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Registration Number
                                    </label>
                                    <input
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                                        type="text"
                                        placeholder="Enter registration number"
                                        name="registrationNo"
                                        onChange={handleChange}
                                        value={formData.registrationNo}
                                    />
                                </div>

                                {/* Company Since */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Company Since *
                                    </label>
                                    <input
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                                        type="text"
                                        placeholder="e.g., 2020"
                                        name="companySince"
                                        onChange={handleChange}
                                        value={formData.companySince}
                                    />
                                </div>

                                {/* Street Address */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Street Address *
                                    </label>
                                    <input
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                                        type="text"
                                        placeholder="Enter your street address"
                                        name="companyStreetAddress"
                                        onChange={handleChange}
                                        value={formData.companyStreetAddress}
                                    />
                                </div>

                                {/* City */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        City *
                                    </label>
                                    <input
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                                        type="text"
                                        placeholder="Enter city"
                                        name="city"
                                        onChange={handleChange}
                                        value={formData.city}
                                    />
                                </div>

                                {/* State */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        State *
                                    </label>
                                    <input
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                                        type="text"
                                        placeholder="Enter state"
                                        name="state"
                                        onChange={handleChange}
                                        value={formData.state}
                                    />
                                </div>

                                {/* Zipcode */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Zipcode *
                                    </label>
                                    <input
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                                        type="text"
                                        placeholder="Enter zipcode"
                                        name="zipcode"
                                        onChange={handleChange}
                                        value={formData.zipcode}
                                    />
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Company Phone *
                                    </label>
                                    <input
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                                        type="text"
                                        placeholder="Enter phone number"
                                        name="phone"
                                        onChange={handleChange}
                                        value={formData.phone}
                                    />
                                </div>

                                {/* Email */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Company Email *
                                    </label>
                                    <input
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                                        type="email"
                                        placeholder="Enter company email"
                                        name="email"
                                        onChange={handleChange}
                                        value={formData.email}
                                    />
                                </div>
                            </div>

                            {/* Terms and Conditions */}
                            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                                <div className="flex items-start space-x-3">
                                    <input
                                        type="checkbox"
                                        id="termsCheckbox"
                                        onChange={handleCheckboxChange}
                                        className="mt-1 w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                    />
                                    <label htmlFor="termsCheckbox" className="text-sm text-gray-700 leading-relaxed">
                                        By continuing, you agree to our{' '}
                                        <span className="text-red-600 font-semibold">Terms of Use</span>,{' '}
                                        <span className="text-red-600 font-semibold">Privacy Policy</span>,{' '}
                                        <span className="text-red-600 font-semibold">E-sign</span> &{' '}
                                        <span className="text-red-600 font-semibold">communication Authorization</span>.
                                    </label>
                                </div>
                            </div>

                            {/* Alert Messages */}
                            {alert.show && <Alert {...alert} removeAlert={showAlert} list={list} />}

                            {/* Submit Button */}
                            <div className="text-center pt-6">
                                {editMode ? (
                                    <button
                                        className={`w-full md:w-auto px-12 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform ${isButtonDisabled || isLoading
                                            ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                                            : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white hover:scale-105 shadow-lg hover:shadow-xl'
                                            }`}
                                        type="submit"
                                        disabled={isButtonDisabled || isLoading}
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center justify-center space-x-2">
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>Updating...</span>
                                            </div>
                                        ) : (
                                            'Update Company'
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        className={`w-full md:w-auto px-12 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform ${isButtonDisabled || isLoading
                                            ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                                            : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white hover:scale-105 shadow-lg hover:shadow-xl'
                                            }`}
                                        type="submit"
                                        disabled={isButtonDisabled || isLoading}
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center justify-center space-x-2">
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>Creating...</span>
                                            </div>
                                        ) : (
                                            'Create Company'
                                        )}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default Company;
