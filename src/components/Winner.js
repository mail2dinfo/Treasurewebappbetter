import React, { useState, useEffect, useRef } from 'react'
import Confetti from "react-confetti";
import { useHistory, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../utils/apiConfig';
import { FaTrophy, FaHome, FaArrowLeft, FaCheckCircle, FaStar, FaMedal, FaGift, FaCoins, FaCalendar, FaUser, FaCreditCard } from 'react-icons/fa';

const Winner = ({ location }) => {
    const history = useHistory();
    const { groupId, reserve } = useParams();
    const chitBasePath = location?.pathname?.startsWith('/chit-fund/manager')
        ? '/chit-fund/manager'
        : '/chit-fund/user';
    const [previewImage, setPreviewImage] = useState('https://github.com/OlgaKoplik/CodePen/blob/master/profile.jpg?raw=true');
    const [error, setError] = useState(null);
    const [altText, setAltText] = useState('');
    const [confettiActive, setConfettiActive] = useState(true);

    // Get winningSub from location state or use fallback
    const winningSub = location?.state?.winningSub || {};
    const imageUrl = winningSub?.winnerObject?.userImage;
    const amount = winningSub?.winnerObject?.winnerAmount || reserve || '5000';
    const winnerName = winningSub?.winnerObject?.name || 'Winner';
    const winnerPhone = winningSub?.winnerObject?.phone || '';
    const groupName = winningSub?.winnerObject?.groupName || 'Auction Group';
    const groupAmount = winningSub?.winnerObject?.group_amount || 0;
    const reserveAmount = winningSub?.winnerObject?.reserveAmount || 0;
    const profitAmount = winningSub?.winnerObject?.profitAmount || 0;
    const groupType = winningSub?.winnerObject?.groupType || '';
    const payableAmount = winningSub?.winnerObject?.payableamnt || 0;

    // Debug logging to see what data we're receiving
    console.log('Full winningSub data:', winningSub);
    console.log('Winner Object:', winningSub?.winnerObject);
    console.log('Winner Name:', winnerName);
    console.log('Winner Phone:', winnerPhone);
    console.log('Group Name:', groupName);
    console.log('Payable Amount:', payableAmount);

    const [height, setHeight] = useState(null);
    const [width, setWidth] = useState(null);
    const confettiRef = useRef(null);

    useEffect(() => {
        if (imageUrl) {
            fetchCompanyLogoUrl(imageUrl);
        }

        if (confettiRef.current) {
            setHeight(confettiRef.current.clientHeight);
            setWidth(confettiRef.current.clientWidth);
        }

        // Stop confetti after 5 seconds
        const timer = setTimeout(() => {
            setConfettiActive(false);
        }, 5000);

        return () => clearTimeout(timer);
    }, [imageUrl]);

    const handleContinueClick = () => {
        history.push(`${chitBasePath}/home`);
    };

    const handleBackToGroup = () => {
        if (groupId && groupId !== 'undefined') {
            history.push(`${chitBasePath}/groups/${groupId}`);
        } else {
            history.push(`${chitBasePath}/home`);
        }
    };

    const handlePayNow = () => {
        // Redirect to payables page
        history.push(`${chitBasePath}/payables`);
    };

    const fetchCompanyLogoUrl = async (logoKey) => {
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/get-signed-url?key=${encodeURIComponent(logoKey)}`, {
                method: 'GET',
                headers: {},
            });

            if (response.ok) {
                const responseBody = await response.json();
                const signedUrl = responseBody.results;
                setPreviewImage(signedUrl);
            } else {
                console.error(`Failed to fetch signed URL for company logo: ${logoKey}`);
            }
        } catch (error) {
            console.error('Error fetching signed URL for company logo:', error);
            setError('Error fetching signed URL for company logo');
        }
    };

    const formatCurrency = (amount) => {
        return `₹${Number(amount).toLocaleString("en-IN")}`;
    };

    // Helper function to get the appropriate amount based on group type
    const getDisplayAmount = () => {
        const groupTypeLower = groupType?.toLowerCase() || '';

        if (groupTypeLower === 'accumulative') {
            return {
                label: 'Reserve Amount',
                amount: reserveAmount
            };
        } else if (groupTypeLower === 'deductive' || groupTypeLower === 'fixed') {
            return {
                label: 'Profit Amount',
                amount: profitAmount
            };
        } else {
            // Default fallback - show reserve amount
            return {
                label: 'Reserve Amount',
                amount: reserveAmount
            };
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" ref={confettiRef}>
            {/* Confetti Animation */}
            {confettiActive && (
                <Confetti
                    numberOfPieces={200}
                    width={width || window.innerWidth}
                    height={height || window.innerHeight}
                    recycle={false}
                    colors={['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']}
                />
            )}

            {/* Header Section */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <button
                            onClick={handleBackToGroup}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                        >
                            <FaArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Back to Group</span>
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900 text-center flex-1">Auction Winner</h1>
                        <div className="w-20"></div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Main Winner Card */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-custom-red to-red-600 p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <FaTrophy className="w-8 h-8" />
                                <div>
                                    <h2 className="text-xl font-semibold">🎉 Congratulations! 🎉</h2>
                                    <p className="text-red-100">Auction Winner</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-red-100">Winning Amount</p>
                                <p className="text-2xl font-bold text-white">{formatCurrency(amount)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Winner Profile */}
                            <div className="text-center lg:text-left">
                                <div className="relative inline-block mb-6">
                                    <img
                                        src={previewImage}
                                        alt={winnerName}
                                        className="w-32 h-32 rounded-full object-cover border-4 border-custom-red shadow-lg"
                                        onError={(e) => {
                                            e.target.src = "https://via.placeholder.com/128x128?text=W";
                                        }}
                                    />
                                    <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-2">
                                        <FaCheckCircle className="w-5 h-5" />
                                    </div>
                                </div>

                                <h2 className="text-2xl font-bold text-gray-900 mb-2">{winnerName}</h2>
                                {winnerPhone && (
                                    <p className="text-gray-600 mb-2">📱 {winnerPhone}</p>
                                )}
                                <p className="text-gray-600 mb-4">Auction Winner</p>

                                <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full">
                                    <FaStar className="w-4 h-4" />
                                    <span className="font-semibold">Winner</span>
                                </div>
                            </div>

                            {/* Auction Details */}
                            <div className="space-y-6">
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <FaMedal className="w-5 h-5 text-blue-600" />
                                        Auction Details
                                    </h3>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 flex items-center gap-2">
                                                <FaUser className="w-4 h-4" />
                                                Winner Name:
                                            </span>
                                            <span className="font-semibold text-gray-900">{winnerName}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 flex items-center gap-2">
                                                📱 Phone:
                                            </span>
                                            <span className="font-semibold text-gray-900">{winnerPhone || 'Not Available'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 flex items-center gap-2">
                                                <FaUser className="w-4 h-4" />
                                                Group Name:
                                            </span>
                                            <span className="font-semibold text-gray-900">{groupName || 'Not Available'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 flex items-center gap-2">
                                                <FaCoins className="w-4 h-4" />
                                                Group Amount:
                                            </span>
                                            <span className="font-semibold text-gray-900">
                                                {formatCurrency(groupAmount)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 flex items-center gap-2">
                                                <FaCoins className="w-4 h-4" />
                                                {getDisplayAmount().label}:
                                            </span>
                                            <span className="font-semibold text-gray-900">
                                                {formatCurrency(getDisplayAmount().amount)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 flex items-center gap-2">
                                                <FaUser className="w-4 h-4" />
                                                Group Type:
                                            </span>
                                            <span className="font-semibold text-gray-900">
                                                {groupType}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 flex items-center gap-2">
                                                <FaCoins className="w-4 h-4" />
                                                Winning Amount:
                                            </span>
                                            <span className="font-bold text-2xl text-green-600">
                                                {formatCurrency(amount)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 flex items-center gap-2">
                                                <FaCalendar className="w-4 h-4" />
                                                Status:
                                            </span>
                                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                                                <FaCheckCircle className="w-3 h-3" />
                                                Completed
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Prize Celebration */}
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <FaGift className="w-5 h-5 text-green-600" />
                                        Your Prize
                                    </h3>
                                    <p className="text-gray-700 mb-3">
                                        You've successfully secured the auction with your winning bid of{' '}
                                        <span className="font-bold text-green-600 text-lg">
                                            {formatCurrency(amount)}
                                        </span>
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        The funds will be processed according to your group's payment schedule.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Information */}
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200 mt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <FaCreditCard className="w-5 h-5 text-purple-600" />
                                Payment Information
                            </h3>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Amount to Pay:</span>
                                <span className="font-bold text-2xl text-purple-600">
                                    {formatCurrency(payableAmount)}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-3">
                                Click "Pay Now" to proceed with the payment for your winning bid.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-8 border-t border-gray-200">
                            <button
                                onClick={handlePayNow}
                                className="flex-1 px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                            >
                                <FaCreditCard className="w-5 h-5" />
                                Pay Now
                            </button>

                            {groupId && groupId !== 'undefined' ? (
                                <button
                                    onClick={handleBackToGroup}
                                    className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                >
                                    <FaArrowLeft className="w-5 h-5" />
                                    Back to Group
                                </button>
                            ) : (
                                <button
                                    onClick={handleContinueClick}
                                    className="flex-1 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                >
                                    <FaHome className="w-5 h-5" />
                                    Go to Home
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Success Message Card */}
                <div className="bg-white rounded-xl shadow-lg border border-green-200 p-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                        <FaCheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">You're All Set!</h3>
                    <p className="text-gray-600">
                        Your auction has been successfully completed. Thank you for participating!
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Winner;
