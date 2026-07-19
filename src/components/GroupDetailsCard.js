import React, { useState, useEffect } from "react";
// import { SubContext } from '../context/subscribecontext';
import styled from "styled-components";
import { MdBusiness, MdLocationOn, MdLink, MdDataObject, MdTimeline, MdTimeToLeave, MdCalendarToday, MdSchedule, MdTimer } from "react-icons/md";
import { FontAwesomeIcon } from "react-icons/fa";
import { useHistory, useLocation, useParams } from "react-router-dom";
import List from "../components/List";
import Alert from "../components/Alert";
import { API_BASE_URL } from "../utils/apiConfig";
import { useUserContext } from "../context/user_context";
import { usePlatformAccess } from "../context/platformAccess_context";
import SendReminderModal from "../components/SendReminderModal";
import { Gavel } from "lucide-react";

const GroupDetailsCard = ({ groups, yourdue, customerdue, nextAuctionDate, startTime, endTime, commisionType, is_commision_taken, commision, emi, isGroupProgress, groupType, groupSubcriberResult }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user } = useUserContext();
    const platform = usePlatformAccess();
    const [list, setList] = useState([]);
    // const { subscriber } = React.useContext(SubContext);
    const history = useHistory();
    const locationDetails = useLocation();
    const basePath = locationDetails.pathname.startsWith('/chit-fund/manager')
        ? '/chit-fund/manager'
        : '/chit-fund/user';
    const isManagerPath = basePath === '/chit-fund/manager';
    const canViewReceivables = !isManagerPath || platform.hasAnyPermission([
        'chit_receivables_view',
        'chit_receivables_pay',
        'chit_receivables',
    ]);
    const canManageAuctions = !isManagerPath || platform.hasPermission('chit_auction_manage');
    const { groupId } = useParams();
    const [localCommision, setLocalCommision] = useState(commision);
    const [lumsumCommissionType, setLumsumCommissionType] = useState("");
    useEffect(() => {
        // This effect will run when the 'commision' prop changes
        // It updates the 'localCommision' state with the new 'commision' value
        setLocalCommision(commision);
    }, [commision]);

    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, msg: "", type: "" });
    const [auctDate, setAuctDate] = useState(() => {
        // Format nextAuctionDate to "YYYY-MM-DD" if it exists

        if (nextAuctionDate) {
            const date = new Date(nextAuctionDate);
            const formattedDate = date.toISOString().split("T")[0]; // Format as "YYYY-MM-DD"
            return formattedDate;
        } else {
            return ""; // Default to an empty string if nextAuctionDate is not available
        }
    });
    const showAlert = (show = false, type = "", msg = "") => {
        setAlert({ show, type, msg });
    };
    const clearList = () => {
        showAlert(true, "danger", "empty list");
        // setList([]);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!auctDate) {
            showAlert(true, "danger", "Please enter the auction date");
        } else if (!localCommision) {
            showAlert(true, "danger", "Please enter the commission value");
        } else {
            setIsLoading(true);

            const commissionData = {
                auctDate: auctDate,
                commision: commision,
                groupId: groupId,
                sourceSystem: "WEB",
                emi: emi,
                lumsumCommissionType: lumsumCommissionType,
                // Add other data related to the commission if needed
            };

            console.log(commissionData);
            // Construct the URL for the API endpoint
            const apiUrl = `${API_BASE_URL}/group-commision`;

            try {
                const response = await fetch(apiUrl, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${user?.results?.token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(commissionData),
                });
                console.log(response);
                if (response.ok) {
                    console.log("mani- inserted");
                    const commissionJsonObject = await response.json();
                    console.log(commissionJsonObject);
                    showAlert(true, "success", commissionJsonObject.message);
                    setIsLoading(false);

                    // Add any additional logic or state updates if needed

                    // Clear the input
                    setAuctDate("");
                } else {
                    const errorResponse = await response.json();
                    console.log(errorResponse);
                    showAlert(true, "danger", errorResponse.message);
                }
            } catch (error) {
                console.error("An error occurred while submitting the commission:", error);
                // Handle the error, e.g., show an error message to the user
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleGoToAuctions = () => {
        history.push(`${basePath}/groups/${groupId}/auctions/date/nextAuctionDate=${nextAuctionDate}`);
    };

    const subscriber = {
        avatar_url: "https://picsum.photos/200/200",
        html_url: "@john_smilga",
        name: "John Smilga",
        company: "Creator of Coding Addict",
        blog: "Coding Addict",
        bio: "", // You didn't provide a value for bio, so I left it empty.
        location: "TamilNadu, India",
        twitter_username: "Mani", // You didn't provide a value for twitter_username, so I left it empty.
    };

    const { avatar_url, html_url, name, company, blog, bio, location, twitter_username } = subscriber;
    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };
    const handleYourDueClick = () => {
        // Redirect to the YourDuePage for the specific groupId
        history.push(`${basePath}/groups/${groupId}/your-due`);
    };
    const handleCustomerDueClick = () => {
        // Redirect to the YourDuePage for the specific groupId
        history.push(`${basePath}/groups/${groupId}/customer-due`);
    };
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg relative mt-6">
            {/* Header */}
            <div className="absolute -top-4 left-6 bg-custom-red text-white px-4 py-1 rounded-full text-sm font-medium shadow-md">
                Group Highlights
            </div>

            <div className="p-6 pt-8">
                <div className={`grid ${canViewReceivables ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1'} gap-4 mb-8`}>
                    {/* Groups Count */}
                    <div className="text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                            <span className="text-white font-bold text-lg">
                                {groups[0]?.groupsCompleted || 0} / {groups[0]?.totalTenture || 0}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-gray-700">Groups</p>
                        <p className="text-xs text-gray-500">Completed / Total</p>
                    </div>

                    {canViewReceivables && (
                        <>
                            {/* Your Due */}
                            <div className="text-center cursor-pointer group" onClick={handleYourDueClick}>
                                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg group-hover:shadow-xl transition-all duration-300">
                                    <span className="text-white font-bold text-lg">
                                        ₹{yourdue[0]?.pending_amount || 0}
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-gray-700">Your Due</p>
                                <p className="text-xs text-gray-500">Pending Amount</p>
                            </div>

                            {/* Customer Due */}
                            <div className="text-center cursor-pointer group" onClick={handleCustomerDueClick}>
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg group-hover:shadow-xl transition-all duration-300">
                                    <span className="text-white font-bold text-lg">
                                        ₹{customerdue[0]?.pending_amount || 0}
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-gray-700">Customer Due</p>
                                <p className="text-xs text-gray-500">Pending Amount</p>
                            </div>
                        </>
                    )}
                </div>

                {/* Auction Details */}
                {canManageAuctions && (
                    <>
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <MdDataObject className="text-red-500" />
                        Auction Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                            <MdCalendarToday className="text-blue-500 w-5 h-5" />
                            <div>
                                <p className="text-sm font-medium text-gray-700">Auction Date</p>
                                <p className="text-gray-600">{nextAuctionDate || "Not scheduled"}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <MdSchedule className="text-green-500 w-5 h-5" />
                            <div>
                                <p className="text-sm font-medium text-gray-700">Start Time</p>
                                <p className="text-gray-600">{startTime || "Not set"}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <MdTimer className="text-red-500 w-5 h-5" />
                            <div>
                                <p className="text-sm font-medium text-gray-700">End Time</p>
                                <p className="text-gray-600">{endTime || "Not set"}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <MdLocationOn className="text-orange-500 w-5 h-5" />
                            <div>
                                <p className="text-sm font-medium text-gray-700">Location</p>
                                <p className="text-gray-600">{location || "Earth"}</p>
                            </div>
                        </div>
                    </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                    {isGroupProgress !== "CLOSED" && (
                        <button
                            onClick={handleGoToAuctions}
                            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            <Gavel size={18} />
                            Go To Auction
                        </button>
                    )}

                    {commisionType === "LUMPSUM" && (
                        is_commision_taken ? (
                            <button
                                className="w-full bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
                                disabled
                            >
                                <Gavel size={18} />
                                Lumpsum Commission Taken
                            </button>
                        ) : (
                            <button
                                onClick={openModal}
                                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                <Gavel size={18} />
                                Take Lumpsum Commission
                            </button>
                        )
                    )}
                    </div>
                    </>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            {alert.show && <Alert {...alert} removeAlert={showAlert} list={list} />}

                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <Gavel className="w-5 h-5 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">Take Lumpsum Commission</h2>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Auction Date
                                    </label>
                                    <input
                                        type="date"
                                        value={auctDate}
                                        onChange={(e) => setAuctDate(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Commission Amount
                                    </label>
                                    <input
                                        type="text"
                                        value={localCommision}
                                        placeholder="Enter Commission Value"
                                        onChange={(e) => setLocalCommision(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Commission Type
                                    </label>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                id="withDue"
                                                name="commissionType"
                                                value="withDue"
                                                onChange={() => setLumsumCommissionType("withDue")}
                                                className="w-4 h-4 text-red-600 focus:ring-red-500"
                                            />
                                            <span className="text-gray-700">With Due</span>
                                        </label>
                                        {groupType === "ACCUMULATIVE" && (
                                            <label className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    id="withReserve"
                                                    name="commissionType"
                                                    value="withReserve"
                                                    onChange={() => setLumsumCommissionType("withReserve")}
                                                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                                                />
                                                <span className="text-gray-700">With Reserve</span>
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={handleSubmit}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    Submit
                                </button>
                                <button
                                    onClick={closeModal}
                                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupDetailsCard;
