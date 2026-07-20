import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/apiConfig';
import { MdOutlineAttachMoney, MdLocationOn, MdTimeline, MdTimeToLeave } from "react-icons/md";
import Modal from "./Modal";
import { useUserContext } from "../context/user_context";
import Alert from '../components/Alert';
import loadingImage from '../images/preloader.gif';

const AreaSubscriberList = ({ people, empRegion, onFilteredCount, refreshDueSubscribers }) => {
    const [, setPaymentSuccess] = useState(false);
    const [list] = useState([]);
    const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
    const [alert, setAlert] = useState({ show: false, msg: "", type: "" });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSubscriber, setSelectedSubscriber] = useState(null);
    const { user } = useUserContext();
    const [signedUrls, setSignedUrls] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [searchLocation, setSearchLocation] = useState('');
    const [filteredPeople, setFilteredPeople] = useState([]);

    const [paymentType, setPaymentType] = useState(""); // State to track payment type (partial or full)
    const [partialAmount, setPartialAmount] = useState(""); // State to store partial payment amount
    const [paymentMethod, setPaymentMethod] = useState("");

    useEffect(() => {
        if (isPaymentSuccess) {
            // Perform any actions you need to refresh the data or component
            // For example, refetching data or resetting state
            //  fetchData(); // Implement this function to fetch the updated data

            // Reset the isPaymentSuccess state to false to avoid multiple refreshes
            setIsPaymentSuccess(false);
        }
    }, [isPaymentSuccess]);

    useEffect(() => {
        const fetchSignedUrls = async () => {
            setLoading(true);
            setError(null);

            try {
                if (Array.isArray(people)) {
                    const promises = people.map(async (item) => {
                        const { user_image } = item;
                        const response = await fetch(`${API_BASE_URL}/get-signed-url?key=${encodeURIComponent(user_image)}`, {
                            method: 'GET',
                            headers: {
                                // Include any headers if needed
                                // 'Authorization': 'Bearer YourAccessToken',
                            },
                        });

                        if (response.ok) {
                            const responseBody = await response.json();
                            const signedUrl = responseBody.results;
                            setSignedUrls(prevUrls => ({ ...prevUrls, [user_image]: signedUrl }));
                        } else {
                            console.error(`Failed to fetch signed URL for user_image: ${user_image}`);
                        }
                    });

                    await Promise.all(promises);
                }
            } catch (error) {
                console.error('Error fetching signed URLs:', error);
                setError('Error fetching signed URLs');
            } finally {
                setLoading(false);
            }
        };

        fetchSignedUrls();
    }, [people]);

    useEffect(() => {
        const filterPeople = () => {
            // Filter the people list based on selected aob
            const filteredByLocation = searchLocation
                ? people.filter(person =>
                    person.aob.toLowerCase() === searchLocation.toLowerCase()
                )
                : people;

            // Filter the people list based on search text and 'name' field
            const filteredByName = filteredByLocation.filter(person => person.username.toLowerCase().includes(searchText.toLowerCase()));

            // Update the filteredPeople state with the filtered result
            setFilteredPeople(filteredByName);
            onFilteredCount(filteredByName.length);
        };

        // Call the filterPeople function when either 'people', 'searchText', or 'searchLocation' changes
        filterPeople();
    }, [people, searchText, searchLocation]);


    const handlePartialPayment = () => {
        setPaymentType("partial");
    };

    const handleFullPayment = () => {
        setPaymentType("full");
    };

    const handlePartialAmountChange = (e) => {
        setPartialAmount(e.target.value);
    };
    const showAlert = (show = false, type = "", msg = "") => {
        setAlert({ show, type, msg });
    };

    const handleSearchChange = (e) => {
        setSearchText(e.target.value);
    };
    const handleLocationChange = (e) => {
        setSearchLocation(e.target.value);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        // Reset any necessary state variables
        setSelectedSubscriber(null);
    };

    const handlePayButtonClick = (subscriber, e) => {
        e.preventDefault();
        setSelectedSubscriber(subscriber);
        setIsModalOpen(true);

    };
    const handlePaymentMethodChange = (e) => {
        setPaymentMethod(e.target.value);
    };

    const handlePayment = async () => {

        

        let eresponseData = null;

        if (!paymentMethod) {
            showAlert(true, "danger", "Please select a payment method.");
            return;
        }

        if (!paymentType) {
            showAlert(true, "danger", "Please select a payment type.");
            return;
        }
        if (paymentType === "partial" && partialAmount === "") {
            showAlert(true, "danger", "Please enter the partial amount.");
            return;
        }
        // Prompt user for confirmation before payment
        const isConfirmed = window.confirm("Are you sure you want to proceed with the payment?");
        if (!isConfirmed) {
            return; // User cancelled payment
        }
        // Implement your payment logic here based on the selected paymentMethod
        if (paymentMethod === "Online") {
            // Process online payment
            console.log(`Online payment for ${selectedSubscriber.username} with ID ${selectedSubscriber.subscriber_id} is processed.`);

            const updatedOnlinePayementData = {
                payableReceivalbeId: selectedSubscriber.receivable_id,
                paymentMethod: paymentMethod,
                paymentStatus: "SUCCESS",
                paymentType: paymentType,
                paymentTransactionRef: "FUTURE",
                payableCode: "001",
                paymentAmount: paymentType === 'full' ? selectedSubscriber.receivable_amount : partialAmount,
                subscriberId: selectedSubscriber.subscriber_id,
                grpSubscriberId: selectedSubscriber.group_subscriber_id,
                sourceSystem: "WEB",
                type: 2,
                groupId: selectedSubscriber.group_id,
                grpAccountId: selectedSubscriber.group_account_id
            };
            console.log("check form data");
            console.log(updatedOnlinePayementData);

            const apiUrl = `${API_BASE_URL}/payments-receipts`;
            try {
                const response = await fetch(apiUrl, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${user?.results?.token}`, // Include the Bearer token
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(updatedOnlinePayementData),
                });
                console.log(response);

                if (response.ok) {
                    const responseData = await response.json();
                    console.log(responseData);
                    showAlert(true, "success", responseData.message);
                    setIsPaymentSuccess(true); // Set the state to true
                    setPaymentSuccess(true);
                    refreshDueSubscribers();
                } else {
                    eresponseData = await response.json();
                    console.log(eresponseData);

                    showAlert(true, "danger", eresponseData.message);
                }
            } catch (error) {
                // Handle network or fetch error, update the message state
                showAlert(true, "danger", eresponseData.message);
            } finally {
                setLoading(false); // Hide loading bar when data fetching is complete
            }
        } else if (paymentMethod === "Cash") {
            // Process online payment
            console.log(`Online payment for ${selectedSubscriber.username} with ID ${selectedSubscriber.subscriber_id} is processed.`);

            const updatedOnlinePayementData = {

                payableReceivalbeId: selectedSubscriber.receivable_id,
                paymentMethod: paymentMethod,
                paymentStatus: "SUCCESS",
                paymentType: paymentType,
                paymentTransactionRef: "FUTURE",
                payableCode: "001",
                paymentAmount: paymentType === 'full' ? selectedSubscriber.receivable_amount : partialAmount,
                subscriberId: selectedSubscriber.subscriber_id,
                grpSubscriberId: selectedSubscriber.group_subscriber_id,
                sourceSystem: "WEB",
                type: 2,

                groupId: selectedSubscriber.group_id,
                grpAccountId: selectedSubscriber.group_account_id
            };
            console.log("check form data");
            console.log(updatedOnlinePayementData);

            const apiUrl = `${API_BASE_URL}/payments-receipts`;
            try {
                const response = await fetch(apiUrl, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${user?.results?.token}`, // Include the Bearer token
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(updatedOnlinePayementData),
                });
                console.log(response);

                if (response.ok) {
                    const responseData = await response.json();
                    console.log(responseData);
                    showAlert(true, "success", responseData.message);
                    setIsPaymentSuccess(true); // Set the state to true
                    setPaymentSuccess(true);
                    refreshDueSubscribers();
                } else {
                    eresponseData = await response.json();
                    console.log(eresponseData);

                    showAlert(true, "danger", eresponseData.message);
                }
            } catch (error) {
                // Handle network or fetch error, update the message state
                showAlert(true, "danger", eresponseData.message);
            } finally {
                setLoading(false); // Hide loading bar when data fetching is complete
            }
            // Process cash payment
            console.log(`Cash payment for ${selectedSubscriber.username} with ID ${selectedSubscriber.subscriber_id} is processed.`);
        }

        // Close the popover after payment
        // closePopover();
    };


    if (loading) {
        return (
            <>
                <img src={loadingImage} className='loading-img' alt='loding' />
                <div className="placeholder" style={{ height: '50vh' }}></div>
            </>
        );
    }
    if (error) {
        return <p>Error: {error}</p>;
    }

    return (
        <>
            <select
                id="location"
                onChange={handleLocationChange}
                value={searchLocation}
                style={{
                    height: '40px', // Adjust the height value as needed
                    padding: '0.25rem',
                    paddingLeft: '1rem',
                    background: 'var(--clr-grey-10)',
                    borderTopLeftRadius: 'var(--radius)',
                    borderBottomLeftRadius: 'var(--radius)',
                    borderTopRightRadius: 'var(--radius)',
                    borderBottomRightRadius: 'var(--radius)',
                    borderColor: 'transparent',
                    fontSize: '1rem',
                    flex: '1 0 auto',
                    color: 'var(--clr-grey-5)',
                    marginBottom: '1rem',
                    marginRight: "12px"
                }}
            >
                <option value="">All Regions</option>
                {empRegion.map(region => (
                    <option key={region.id} value={region.aob}>{region.aob}</option>
                ))}
            </select>

            <input
                type="text"
                id="search"
                value={searchText}
                onChange={handleSearchChange}
                placeholder="Enter name to search"
                style={{
                    height: '40px', // Adjust the height value as needed
                    padding: '0.25rem',
                    paddingLeft: '1rem',
                    background: 'var(--clr-grey-10)',
                    borderTopLeftRadius: 'var(--radius)',
                    borderBottomLeftRadius: 'var(--radius)',
                    borderTopRightRadius: 'var(--radius)',
                    borderBottomRightRadius: 'var(--radius)',
                    borderColor: 'transparent',
                    fontSize: '1rem',
                    flex: '1 0 auto',
                    color: 'var(--clr-grey-5)',
                    marginBottom: '1rem'
                }}
            />


            {filteredPeople.map((person, index) => {
                const { username, phone, user_image, receivable_amount,
                    received_amount,
                    auct_date, group_name, unique_id, outstanding_balance,
                    advance_balance } = person;
                return (
                    <React.Fragment key={unique_id}>
                        <article className='areaperson'>
                            {signedUrls[user_image] ? (
                                <img src={signedUrls[user_image]} alt={username} style={{ alignSelf: "self-start" }} />
                            ) : (
                                <img src="default-image.jpg" alt={username} style={{ alignSelf: "self-start" }} />
                            )}
                            <div>
                                <h4>{username}</h4>
                                <p>{phone} </p>
                                <p>Group Name:{group_name} </p>
                                <p>Auction Date: {auct_date} </p>
                            </div>
                            <>
                                <p>
                                    Due :{receivable_amount}
                                </p>
                                <p>Received:{received_amount}</p>
                                <p>Balance:{outstanding_balance}</p>
                                <p>Advance:{advance_balance}</p>
                                <button onClick={(e) => handlePayButtonClick(person, e)}>Pay</button>
                            </>
                        </article>
                        {index !== filteredPeople.length - 1 && <hr />} {/* Add line if it's not the last item */}
                    </React.Fragment>
                );
            })}

            {/* Modal component to confirm payment */}
            <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
                {alert.show && <Alert {...alert} removeAlert={showAlert} list={list} />}
                {/* Modal content */}
                {selectedSubscriber && (
                    <>
                        <h2 style={{ marginTop: "16px" }}>Payment Confirmation</h2>
                        <div>
                            <img src={signedUrls[selectedSubscriber.user_image]} alt={selectedSubscriber.username} style={{ width: '50px', height: '50px', background: "#f0f0f0" }} />
                            <h3 style={{ marginBottom: "12px" }}>{selectedSubscriber.username}</h3>
                            <p>Group Name: {selectedSubscriber.group_name}</p>
                            <p>Phone: {selectedSubscriber.phone}</p>


                        </div>

                        <div className="links" style={{ paddingLeft: "8px" }}>
                            <p>
                                <MdOutlineAttachMoney  ></MdOutlineAttachMoney  > <span style={{ width: "110px" }}>Auction Due</span>: {selectedSubscriber.receivable_amount}{" "}
                            </p>
                            <p>
                                <MdTimeline></MdTimeline> <span style={{ width: "110px" }}>Paid</span>: {selectedSubscriber.received_amount}{" "}
                            </p>
                            <p>
                                <MdTimeToLeave></MdTimeToLeave> <span style={{ width: "110px" }}>Balance</span>: {selectedSubscriber.outstanding_balance}{" "}
                            </p>
                            <p>
                                <MdLocationOn></MdLocationOn> <span style={{ width: "110px" }}>Advance</span>: {selectedSubscriber.advance_balance || "earth"}{" "}
                            </p>

                        </div>

                        <div>
                            {/* Select payment method */}
                            <h4 style={{ marginTop: "16px", marginBottom: "4px" }}>Select Payment Method:</h4>
                            <label style={{ marginRight: "20px" }}>
                                <input type="radio" name="paymentMethod" value="Cash" checked={paymentMethod === "Cash"} style={{ marginRight: "8px" }} onChange={handlePaymentMethodChange} />
                                Cash Payment
                            </label>
                            <label style={{ marginRight: "20px" }}>
                                <input type="radio" name="paymentMethod" value="Online" checked={paymentMethod === "Online"} style={{ marginRight: "8px" }} onChange={handlePaymentMethodChange} />
                                Online Payment
                            </label>
                        </div>

                        <div>
                            <h4 style={{ marginTop: "16px", marginBottom: "4px" }}>Select Payment Type:</h4>
                            <label style={{ marginRight: "20px" }}>
                                <input type="radio" name="paymentType" value="partial" checked={paymentType === "partial"} style={{ marginRight: "8px" }} onChange={handlePartialPayment} />
                                Partial Payment
                            </label>
                            <label style={{ marginRight: "20px" }}>
                                <input type="radio" name="paymentType" value="full" checked={paymentType === "full"} style={{ marginRight: "8px" }} onChange={handleFullPayment} />
                                Full Payment
                            </label>
                            {paymentType === "partial" && (
                                <div>
                                    <label htmlFor="partialAmount">Enter Partial Amount:</label>
                                    <input type="number" id="partialAmount" value={partialAmount} onChange={handlePartialAmountChange} />
                                </div>
                            )}
                            <button onClick={handlePayment} style={{ marginTop: "24px" }}>Submit</button>
                            <button onClick={handleCloseModal} style={{ marginTop: "20px" }}>Cancel</button>
                        </div>
                    </>
                )}
            </Modal>
        </>
    );
};

export default AreaSubscriberList;
