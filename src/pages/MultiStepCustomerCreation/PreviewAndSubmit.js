import React, { useContext, useState } from "react";
import { useHistory } from "react-router-dom";
import AppContext from "./Context";
import { useUserContext } from "../../context/user_context";
import { useCompanySubscriberContext } from '../../context/companysubscriber_context';
import { API_BASE_URL } from "../../utils/apiConfig";
import { uploadImage } from "../../utils/uploadImage";
import Alert from '../../components/Alert';

const PreviewAndSubmit = () => {
    const { fetchCompanySubscribers } = useCompanySubscriberContext();
    const {
        personalDetails,
        contactDetails,
        addressDetails,
        bankDetails,
        financeDetails,
        nomineeDetails,
        businessDetails,
        stepDetails,
        photoDetails,
        setPassword,
    } = useContext(AppContext);

    const [alert, setAlert] = useState({ show: false, msg: '', type: '' });
    const [list] = useState([]);

    const { isLoggedIn, user, userRole } = useUserContext();
    const history = useHistory();

    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const defaultImage = "https://i.imgur.com/ndu6pfe.png"; // Default profile image

    // Merge all customer data for submission
    const customerData = {
        personal: {
            name: personalDetails.subscriberName,
            age: personalDetails.age,
            dob: personalDetails.dob,
            gender: personalDetails.gender,
            maritalStatus: personalDetails.maritalStatus,
            nationality: personalDetails.nationality,
            education: personalDetails.education,
            spouseName: personalDetails.spouseName,
            spouseDob: personalDetails.spouseDob,
            spouseAge: personalDetails.spouseAge,
        },
        finance: {
            occupation: financeDetails.occupation,
            annualIncome: financeDetails.annualIncome,
            aadhar: financeDetails.aadhar,
            pan: financeDetails.pan,

        },
        phone: contactDetails.phone,
        address: {
            streetName: addressDetails.streetName,
            villageName: addressDetails.villageName,
            pincode: addressDetails.pincode,
            taluk: addressDetails.taluk,
            district: addressDetails.district,
            latitude: addressDetails.latitude,
            longitude: addressDetails.longitude,
        },
        bank: {
            bankName: bankDetails.bankName,
            branchName: bankDetails.branch,
            bankIfsc: bankDetails.bankIFSC,
            bankAccnum: bankDetails.accountNumber,
        },
        nominee: {
            name: nomineeDetails.nominee,
            relationship: nomineeDetails.relationship,
        },
        businessDetails: {
            type: businessDetails.businessType,
            annualTurnover: businessDetails.annualTurnover,
        },
        sourceSystem: "WEB",
        referredBy: user?.results?.userId,
    };

    const showAlert = (show = false, type = '', msg = '') => {

        setAlert({ show, type, msg });
    };

    const handleCustomerSubmit = async () => {
        setIsLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            console.log("📨 Submitting customer data...");

            // ✅ Step 1: Validate & Upload Image
            if (photoDetails?.image) {
                const imageFile = photoDetails.image.file;

                // Ensure `photoDetails.image` is a valid File object
                if (!(imageFile instanceof File)) {
                    throw new Error("Selected image is not a valid file.");
                }

                const imageUrl = await uploadImage(imageFile, API_BASE_URL, setErrorMessage);
                if (imageUrl) {
                    customerData.image = imageUrl;
                    photoDetails.image.previewUrl = imageUrl; // Save for display
                } else {
                    throw new Error("Image upload failed.");
                }
            }

            // ✅ Step 2: Submit Customer Data
            if (isLoggedIn) {
                const response = await fetch(`${API_BASE_URL}/multistepsubscriber`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${user.results.token}`,
                        "Content-Type": "application/json",
                        "X-User-Role": userRole,
                    },
                    body: JSON.stringify(customerData),
                });

                const responseData = await response.json(); // Parse response
                console.log(responseData);
                if (!response.ok) {

                    const errorMessage = responseData.errors || responseData.message || "An error occurred";
                    showAlert(true, 'danger', errorMessage);
                    setErrorMessage(errorMessage);


                    return; // Stop execution and do not proceed to the next step
                } else {
                    showAlert(true, 'success', responseData.message);
                    setSuccessMessage("Customer details submitted successfully!");
                    fetchCompanySubscribers();
                    console.log(responseData);

                    if (responseData.results && responseData.results.randomPassword) {
                        setPassword(responseData.results.randomPassword);
                    }

                    stepDetails.setStep(stepDetails.step + 1); // Move to next step only on success
                }
                // Move to next step
            } else {
                // ✅ Store data locally if user is not logged in
                const uniqueKey = generateUniqueKey();
                localStorage.setItem(
                    "unauthenticatedCustomer",
                    JSON.stringify({ ...customerData, customerId: uniqueKey })
                );
                history.push("/login");
            }
        } catch (error) {


            // ✅ Show alert with the extracted error message
            showAlert(true, "danger", error.message);

        } finally {

            setIsLoading(false);
        }
    };


    // ✅ Function to generate unique key for local storage
    const generateUniqueKey = () => {
        return `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    // ✅ Function to render preview of customer details
    const renderPreviewList = () => {
        const image = photoDetails?.image; // Extract image correctly

        return (
            <ul>
                <li>

                    <span>Photo:</span>
                    <img
                        src={image?.previewUrl || defaultImage}
                        alt="Selected Avatar"
                        style={{ width: 150, height: 150, borderRadius: "50%" }}
                    />
                </li>
                <li><span>Name:</span> {customerData.personal.name}</li>
                <li><span>Age:</span> {customerData.personal.age}</li>
                <li><span>Date of Birth:</span> {customerData.personal.dob}</li>
                <li><span>Gender:</span> {customerData.personal.gender}</li>
                <li><span>Marital Status:</span> {customerData.personal.maritalStatus}</li>
                <li><span>Nationality:</span> {customerData.personal.nationality}</li>
                <li><span>Education:</span> {customerData.personal.education}</li>
                <li><span>Occupation:</span> {customerData.finance.occupation}</li>
                <li><span>Annual Income:</span> {customerData.finance.annualIncome}</li>
                <li><span>PAN:</span> {customerData.finance.pan}</li>
                <li><span>Aadhar:</span> {customerData.finance.aadhar}</li>
                <li><span>Phone:</span> {customerData.phone}</li>
                <li>

                    <span>Bank Details:</span> {`${customerData.bank.bankName}, ${customerData.bank.branchName}, ${customerData.bank.bankIfsc}, ${customerData.bank.bankAccnum}`}
                </li>
                <li>
                    <span>Address:</span> {`${customerData.address.streetName}, ${customerData.address.villageName}, ${customerData.address.taluk}, ${customerData.address.district}, ${customerData.address.pincode}`}
                    {(customerData.address.latitude && customerData.address.longitude) && (
                        <div className="text-sm text-gray-600 mt-1">
                            📍 Coordinates: {customerData.address.latitude}, {customerData.address.longitude}
                        </div>
                    )}
                </li>
                <li><span>Nominee:</span> {customerData.nominee.name} ({customerData.nominee.relationship})</li>
                <li><span>Business Type:</span> {customerData.businessDetails.type}</li>
                <li><span>Annual Turnover:</span> {customerData.businessDetails.annualTurnover}</li>
            </ul>
        );
    };

    return (
        <div className="max-w-4xl mx-auto my-4 bg-white rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden">
            {alert.show && <Alert {...alert} removeAlert={showAlert} list={list} />}
            <div className="bg-red-600 text-white p-6 text-center">
                <h2 className="text-2xl font-bold font-['Poppins']">Preview and Submit</h2>
            </div>
            <div className="p-8">

                <div className="flex gap-4 mb-8">
                    <button
                        className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 hover:from-gray-600 hover:to-gray-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gray-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        type="button"
                        onClick={() => stepDetails.setStep(stepDetails.step - 1)}
                        disabled={isLoading}
                    >
                        Previous
                    </button>
                    <button
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 hover:from-green-700 hover:to-green-800 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        type="button"
                        onClick={handleCustomerSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? "Submitting..." : "Submit"}
                    </button>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Review Your Information</h3>
                    {renderPreviewList()}
                </div>

                {errorMessage && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                        {errorMessage}
                    </div>
                )}
                {successMessage && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                        {successMessage}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PreviewAndSubmit;
