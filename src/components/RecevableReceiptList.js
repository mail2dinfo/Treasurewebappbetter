import React, { useState, useEffect } from "react";
import Modal from "./Modal"; // Import your Modal component
import { API_BASE_URL } from "../utils/apiConfig";
import Alert from "../components/Alert";
import { useUserContext } from "../context/user_context";

const RecevableReceiptList = ({ subscribers, refreshSubscribers }) => {
    const [signedUrls, setSignedUrls] = useState({});
    const [, setLoading] = useState(true);
    const [, setError] = useState(null);

    const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
    const [, setIsLoading] = useState(false);
    const [list] = useState([]);
    const { user } = useUserContext();
    const [alert, setAlert] = useState({ show: false, msg: "", type: "" });
    const [selectedSubscriber, setSelectedSubscriber] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [paymentType, setPaymentType] = useState(""); // State to track payment type (partial or full)
    const [partialAmount, setPartialAmount] = useState(""); // 

    useEffect(() => {
        const fetchSignedUrls = async () => {
            setLoading(true);
            setError(null);

            try {
                if (Array.isArray(subscribers)) {
                    const promises = subscribers.map(async (item) => {
                        const { user_image } = item;

                        // Fetch the signed URL for each user_image using a GET request
                        const response = await fetch(`${API_BASE_URL}/get-signed-url?key=${encodeURIComponent(user_image)}`, {
                            method: 'GET',
                            headers: {
                                // Include any headers if needed
                                // 'Authorization': 'Bearer YourAccessToken',
                            },
                        });

                        console.log(response.json);

                        if (response.ok) {
                            const responseBody = await response.json();
                            const signedUrl = responseBody.results;
                            setSignedUrls(prevUrls => ({ ...prevUrls, [user_image]: signedUrl }));

                        } else {
                            // Handle error if needed
                            console.error(`Failed to fetch signed URL for user_image: ${user_image}`);
                        }
                    });

                    await Promise.all(promises);
                }
            } catch (error) {
                // Handle fetch error
                console.error('Error fetching signed URLs:', error);
                setError('Error fetching signed URLs');
            } finally {
                setLoading(false);
            }
        };

        fetchSignedUrls();
    }, [subscribers]);

    useEffect(() => {
        if (isPaymentSuccess) {
            // Perform any actions you need to refresh the data or component
            // For example, refetching data or resetting state
            fetchData(); // Implement this function to fetch the updated data

            // Reset the isPaymentSuccess state to false to avoid multiple refreshes
            setIsPaymentSuccess(false);
        }
    }, [isPaymentSuccess]);

    // Check if subscribers is null or undefined
    // Check if subscribers is an array
    if (!Array.isArray(subscribers)) {
        return null; // You can return a loadin g indicator or an empty list
    }

    if (!subscribers) {
        return null; // You can return a loading indicator or an empty list
    }

    // Define your fetchData function here. It should refresh your data after a successful payment.
    const fetchData = async () => {
        try {
            console.log("refreshing");
            // Fetch and update your data here
        } catch (error) {
            // Handle any errors that occur during data fetching
        }
    };

    const showAlert = (show = false, type = "", msg = "") => {
        setAlert({ show, type, msg });
    };
    const openPopover = (subscriber) => {
        setSelectedSubscriber(subscriber);
        setPaymentMethod(null); // Reset the selected payment method when opening the popover
        setPaymentSuccess(false); // Reset payment success state
    };

    const closePopover = () => {
        setSelectedSubscriber(null);
        setPaymentMethod(null); // Reset the selected payment method when closing the popover
        setPaymentSuccess(false); // Reset payment success state
    };

    const handlePartialPayment = () => {
        setPaymentType("partial");
    };

    const handleFullPayment = () => {
        setPaymentType("full");
    };

    const handlePartialAmountChange = (e) => {
        setPartialAmount(e.target.value);
    };

    const handlePayment = async (subscriber, e) => {
        e.preventDefault();
        let eresponseData = null;
        // Implement your payment logic here based on the selected paymentMethod
        if (paymentMethod === "online") {
            // Process online payment
            console.log(`Online payment for ${subscriber.name} with ID ${subscriber.subscriber_id} is processed.`);

            const updatedOnlinePayementData = {
                payableReceivalbeId: subscriber.receivableid,
                paymentMethod: paymentMethod,
                paymentStatus: "SUCCESS",
                paymentType: paymentMethod,
                paymentTransactionRef: "FUTURE",
                payableCode: "001",
                paymentAmount: paymentType === 'full' ? subscriber.outstanding_balance: partialAmount,
                subscriberId: subscriber.subscriber_id,
                grpSubscriberId: subscriber.group_subscriber_id,
                sourceSystem: "WEB",
                type: 2,
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
                    refreshSubscribers();
                } else {
                    eresponseData = await response.json();
                    console.log(eresponseData);

                    showAlert(true, "danger", eresponseData.message);
                }
            } catch (error) {
                // Handle network or fetch error, update the message state
                showAlert(true, "danger", eresponseData.message);
            } finally {
                setIsLoading(false); // Hide loading bar when data fetching is complete
            }
        } else if (paymentMethod === "cash") {
            // Process online payment
            console.log(`Online payment for ${subscriber.name} with ID ${subscriber.subscriber_id} is processed.`);

            const updatedOnlinePayementData = {
                payableReceivalbeId: subscriber.receivableid,
                paymentMethod: paymentMethod,
                paymentStatus: "SUCCESS",
                paymentType: paymentMethod,
                paymentTransactionRef: "FUTURE",
                payableCode: "001",
                paymentAmount: paymentType === 'full' ? subscriber.outstanding_balance: partialAmount,
                subscriberId: subscriber.subscriber_id,
                grpSubscriberId: subscriber.group_subscriber_id,
                sourceSystem: "WEB",
                type: 2,
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
                    refreshSubscribers();
                } else {
                    eresponseData = await response.json();
                    console.log(eresponseData);

                    showAlert(true, "danger", eresponseData.message);
                }
            } catch (error) {
                // Handle network or fetch error, update the message state
                showAlert(true, "danger", eresponseData.message);
            } finally {
                setIsLoading(false); // Hide loading bar when data fetching is complete
            }
            // Process cash payment
            console.log(`Cash payment for ${subscriber.name} with ID ${subscriber.subscriber_id} is processed.`);
        }

        // Close the popover after payment
        // closePopover();
    };

    return (
        <>
            {subscribers.map((subscriber) => {
                const { name, payment_status, receivableid, outstanding_balance } = subscriber;

                // Conditionally apply a CSS class based on payment_status
                const buttonClassName = payment_status === "Success" ? "paid-button" : "due-button"; // Add 'due-button' class for 'Due'

                return (
                    <article key={receivableid} className="person">
                        {signedUrls[subscriber.user_image] ? (
                            // Render image using the signed URL
                            <img src={signedUrls[subscriber.user_image]} alt={subscriber.name} />
                        ) : (
                            // Render a default image or handle other cases as needed
                            <img src="default-image.jpg" alt={subscriber.name} />
                        )}
                        <div>
                            <h4 style={{ fontSize: "14px", margin: "8px 0 4px" }}>{name}</h4>
                            <p style={{ fontSize: "12px", marginTop: "0" }}>{outstanding_balance} Rs</p>
                        </div>
                        <button onClick={() => openPopover(subscriber)} className={buttonClassName}>
                            {payment_status}
                        </button>

                        {selectedSubscriber === subscriber && (
                            <Modal isOpen={true} onClose={closePopover}>
                                <h2 className="popup-header-text">Payment Confirmation</h2>
                                {alert.show && <Alert {...alert} removeAlert={showAlert} list={list} />}
                                <div className="confirmation-content">
                                    <div className="subscriber-info" style={{ marginTop: "16px" }}>

                                        {signedUrls[subscriber.user_image] ? (
                                            // Render image using the signed URL
                                            <img src={signedUrls[subscriber.user_image]} alt={subscriber.name} />
                                        ) : (
                                            // Render a default image or handle other cases as needed
                                            <img src="default-image.jpg" alt={subscriber.name} />
                                        )}
                                        <h3 className="" style={{ marginTop: "8px", fontSize: "16px", fontWeight: "600", textTransform: "capitalize" }}>
                                            {name}
                                        </h3>
                                        <p style={{ marginTop: "12px", fontSize: "16px", color: "#222" }}>
                                            Total amount:<b style={{ marginLeft: "16px" }}>{outstanding_balance}rs</b>
                                        </p>
                                    </div>

                                    <div>
                                        <h4>Select Payment Type:</h4>
                                        <label>
                                            <input type="radio" name="paymentType" value="partial" checked={paymentType === "partial"} onChange={handlePartialPayment} />
                                            Partial Payment
                                        </label>
                                        <label>
                                            <input type="radio" name="paymentType" value="full" checked={paymentType === "full"} onChange={handleFullPayment} />
                                            Full Payment
                                        </label>
                                        {paymentType === "partial" && (
                                            <div>
                                                <label htmlFor="partialAmount">Enter Partial Amount:</label>
                                                <input type="number" id="partialAmount" value={partialAmount} onChange={handlePartialAmountChange} />
                                            </div>
                                        )}

                                    </div>

                                    <div className="payment-options" style={{ marginTop: "8px" }}>
                                        <label>Payment Method:</label>
                                        <label>
                                            <input type="radio" name="paymentMethod" value="online" checked={paymentMethod === "online"} onChange={() => setPaymentMethod("online")} style={{ margin: "0 4px 0 16px" }} />
                                            Pay Online
                                        </label>
                                        <label>
                                            <input type="radio" name="paymentMethod" value="cash" checked={paymentMethod === "cash"} onChange={() => setPaymentMethod("cash")} style={{ margin: "0 4px 0 16px" }} />
                                            Pay Cash
                                        </label>
                                    </div>
                                    {paymentMethod && !paymentSuccess ? (
                                        <button onClick={(e) => handlePayment(subscriber, e)} className="successBtn">
                                            Pay
                                        </button>
                                    ) : null}
                                    <button onClick={closePopover} type="submit" className="cancelBtn">
                                        Cancel
                                    </button>
                                    {paymentSuccess ? (
                                        <div className="payment-success" style={{ marginTop: "12px", color: "green" }}>
                                            Payment successful for {name}!
                                        </div>
                                    ) : null}
                                </div>
                            </Modal>
                        )}
                    </article>
                );
            })}
        </>
    );
};

export default RecevableReceiptList;
