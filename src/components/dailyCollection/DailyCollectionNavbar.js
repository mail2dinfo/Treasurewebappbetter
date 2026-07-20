import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useUserContext } from '../../context/user_context';
import { FiLogOut, FiHome, FiGrid, FiCreditCard } from 'react-icons/fi';
import { API_BASE_URL } from '../../utils/apiConfig';
import { downloadImage } from '../../utils/downloadImage';
import MyTreasureBrand from '../MyTreasureBrand';
import { useBilling } from '../../context/billing_context';
import { getNavBillingBadge } from '../../utils/billingPaymentUtils';
import { DC_BASE_PATH } from './dailyCollectionMenuItems';

const navButtonClass =
    'flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-custom-red hover:bg-gray-100 rounded-lg transition-colors';

const capitalizeName = (value) => {
    const name = String(value || '').trim();
    if (!name) return 'User';
    return name.charAt(0).toUpperCase() + name.slice(1);
};

const BillingNavButton = ({ billingPath }) => {
    const history = useHistory();
    const { subscription, payments } = useBilling();
    const badge = getNavBillingBadge(subscription, payments);

    if (!billingPath) return null;

    return (
        <button
            type="button"
            onClick={() => history.push(billingPath)}
            className={`${navButtonClass} relative`}
        >
            <FiCreditCard className="w-4 h-4 mr-1.5" />
            <span>Billing</span>
            {badge.status !== 'unknown' && (
                <span
                    className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                        badge.color === 'red'
                            ? 'bg-red-100 text-red-800'
                            : badge.color === 'blue'
                                ? 'bg-blue-100 text-blue-800'
                                : badge.color === 'green'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                    }`}
                >
                    {badge.message}
                </span>
            )}
        </button>
    );
};

const DailyCollectionNavbar = () => {
    const history = useHistory();
    const { user, logout } = useUserContext();
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('https://i.imgur.com/ndu6pfe.png');

    const dashboardPath = `${DC_BASE_PATH}/dashboard`;
    const billingPath = `${DC_BASE_PATH}/billing`;
    const displayName = capitalizeName(
        user?.results?.firstname
        || user?.results?.userDetail?.userName
        || user?.results?.name
        || 'User'
    );

    useEffect(() => {
        if (user) {
            fetchImage();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const getImageSrc = (userImage) => {
        if (!userImage) return 'default-avatar.png';
        return userImage.startsWith('data:image/') || userImage.startsWith('http')
            ? userImage
            : `${API_BASE_URL}/uploads/${userImage}`;
    };

    const fetchImage = async () => {
        try {
            if (user?.results?.userDetail?.user_image_s3_image) {
                setPreviewUrl(user.results.userDetail.user_image_s3_image);
            } else if (user?.results?.user_image_s3_image) {
                setPreviewUrl(user.results.user_image_s3_image);
            } else if (user?.results?.userDetail?.userImage) {
                const imageUrl = getImageSrc(user.results.userDetail.userImage);
                const downloadedImage = await downloadImage(imageUrl);
                setPreviewUrl(downloadedImage || imageUrl);
            } else if (user?.results?.user_image) {
                const imageUrl = getImageSrc(user.results.user_image);
                const downloadedImage = await downloadImage(imageUrl);
                setPreviewUrl(downloadedImage || imageUrl);
            }
        } catch {
            setPreviewUrl('https://i.imgur.com/ndu6pfe.png');
        }
    };

    const handleLogout = () => {
        logout();
        history.push('/login');
    };

    return (
        <header className="bg-white border-b-2 border-custom-red sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-14">
                    <MyTreasureBrand to={dashboardPath} subtitle="Daily Collection" />

                    <div className="flex items-center space-x-2 sm:space-x-3">
                        <button
                            type="button"
                            onClick={() => history.push(dashboardPath)}
                            className={navButtonClass}
                        >
                            <FiHome className="w-4 h-4 mr-1.5" />
                            <span>Home</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => history.push('/app-selection')}
                            className={navButtonClass}
                        >
                            <FiGrid className="w-4 h-4 mr-1.5" />
                            <span className="hidden sm:inline">Finance Hub</span>
                            <span className="sm:hidden">Hub</span>
                        </button>

                        <BillingNavButton billingPath={billingPath} />

                        <div className="hidden sm:block text-right px-2 border-l border-gray-200">
                            <p className="text-sm font-semibold text-gray-800 truncate max-w-[10rem]">
                                Hi {displayName}
                            </p>
                            <p className="text-xs text-gray-500">Logged in as User</p>
                        </div>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsTooltipVisible(!isTooltipVisible)}
                                onBlur={() => setTimeout(() => setIsTooltipVisible(false), 150)}
                                className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300 hover:border-custom-red transition-colors"
                                aria-label={`${displayName}, User`}
                            >
                                <img
                                    src={previewUrl}
                                    alt={displayName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://i.imgur.com/ndu6pfe.png';
                                    }}
                                />
                            </button>
                            {isTooltipVisible && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                    <div className="px-4 py-3 border-b border-gray-200">
                                        <p className="text-sm font-semibold text-gray-900">
                                            Hi {displayName}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Logged in as User
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                                    >
                                        <FiLogOut className="w-4 h-4 mr-2" />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default DailyCollectionNavbar;
