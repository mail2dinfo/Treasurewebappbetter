import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useUserContext } from '../../context/user_context';
import { usePlatformAccess } from '../../context/platformAccess_context';
import { FiLogOut, FiHome, FiGrid } from 'react-icons/fi';
import { API_BASE_URL } from '../../utils/apiConfig';
import { downloadImage } from '../../utils/downloadImage';
import { getVehicleFinanceBasePath } from './vehicleFinanceMenuItems';
import MyTreasureBrand from '../MyTreasureBrand';

const navButtonClass =
    'flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-custom-red hover:bg-gray-100 rounded-lg transition-colors';

const formatRoleLabel = (roleCode, basePath) => {
    const normalized = String(roleCode || '').toUpperCase();
    if (normalized === 'MANAGER') return 'Manager';
    if (normalized === 'COLLECTOR') return 'Collector';
    if (normalized === 'ACCOUNTANT') return 'Accountant';
    if (normalized === 'USER' || normalized === 'OWNER') return 'User';
    if (basePath.includes('/manager')) return 'Manager';
    if (basePath.includes('/collector')) return 'Collector';
    return 'User';
};

const capitalizeName = (value) => {
    const name = String(value || '').trim();
    if (!name) return 'User';
    return name.charAt(0).toUpperCase() + name.slice(1);
};

const VehicleFinanceNavbar = () => {
    const history = useHistory();
    const location = useLocation();
    const { user, logout, userRole } = useUserContext();
    const platform = usePlatformAccess();
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const [image, setImage] = useState('');
    const [previewUrl, setPreviewUrl] = useState('https://i.imgur.com/ndu6pfe.png');

    const basePath = getVehicleFinanceBasePath(location.pathname);
    const dashboardPath = `${basePath}/dashboard`;
    const displayName = capitalizeName(
        user?.results?.firstname
        || user?.results?.userDetail?.userName
        || user?.results?.name
        || 'User'
    );
    const roleLabel = formatRoleLabel(
        platform?.activeContext?.roleCode || userRole,
        basePath
    );

    useEffect(() => {
        if (user) {
            fetchImage();
        }
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

    const handleGoHome = () => {
        history.push(dashboardPath);
    };

    const handleGoToHub = () => {
        history.push('/app-selection');
    };

    return (
        <header className="bg-white border-b-2 border-custom-red sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-14">
                    <MyTreasureBrand to={dashboardPath} subtitle="Vehicle Finance" />

                    <div className="flex items-center space-x-2 sm:space-x-3">
                        <button type="button" onClick={handleGoHome} className={navButtonClass}>
                            <FiHome className="w-4 h-4 mr-1.5" />
                            <span>Home</span>
                        </button>

                        <button type="button" onClick={handleGoToHub} className={navButtonClass}>
                            <FiGrid className="w-4 h-4 mr-1.5" />
                            <span className="hidden sm:inline">Finance Hub</span>
                            <span className="sm:hidden">Hub</span>
                        </button>

                        <div className="hidden sm:block text-right px-2 border-l border-gray-200">
                            <p className="text-sm font-semibold text-gray-800 truncate max-w-[10rem]">
                                Hi {displayName}
                            </p>
                            <p className="text-xs text-gray-500">Logged in as {roleLabel}</p>
                        </div>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsTooltipVisible(!isTooltipVisible)}
                                onBlur={() => setTimeout(() => setIsTooltipVisible(false), 150)}
                                className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300 hover:border-custom-red transition-colors"
                                aria-label={`${displayName}, ${roleLabel}`}
                            >
                                <img
                                    src={image || previewUrl}
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
                                            Logged in as {roleLabel}
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

export default VehicleFinanceNavbar;
