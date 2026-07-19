import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    FaUserMinus,
    FaUserPlus,
    FaUser,
    FaCog,
    FaUsers,
    FaTachometerAlt,
    FaMoneyBillWave,
    FaCreditCard,
    FaShieldAlt,
    FaBook,
    FaSignInAlt,
    FaBox
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import { useUserContext } from "../context/user_context";
import { usePlatformAccess } from "../context/platformAccess_context";
import { useHistory } from "react-router-dom";
import { API_BASE_URL } from '../utils/apiConfig';
import { hasPermission } from '../rbacPermissionUtils';
import { downloadImage } from "../utils/downloadImage";

const formatRoleLabel = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    return raw
        .split(/[\s_]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
};

const ROLE_CODE_LABELS = {
    OWNER: 'Owner',
    USER: 'User',
    MANAGER: 'Manager',
    COLLECTOR: 'Collector',
    ACCOUNTANT: 'Accountant',
};

const CartButtons = ({ scrolled }) => {
    const history = useHistory();
    const location = useLocation();
    const { user, logout, userRole } = useUserContext();
    const platform = usePlatformAccess();
    const { closeSidebar } = useUserContext();
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const [image, setImage] = useState('');
    const [previewUrl, setPreviewUrl] = useState('https://i.imgur.com/ndu6pfe.png'); // Default image
    const [isMobile, setIsMobile] = useState(false);
    const [popupPosition, setPopupPosition] = useState('right-0');
    const hideTooltipTimer = useRef(null);

    const displayName = formatRoleLabel(
        user?.results?.firstname
        || user?.results?.userDetail?.userName
        || user?.results?.name
        || 'Guest'
    );

    const roleLabel = useMemo(() => {
        const activeRoleCode = String(platform?.activeContext?.roleCode || '').toUpperCase();
        if (activeRoleCode && ROLE_CODE_LABELS[activeRoleCode]) {
            return ROLE_CODE_LABELS[activeRoleCode];
        }

        const fromUserRole = formatRoleLabel(userRole);
        if (fromUserRole) return fromUserRole;

        const accounts = user?.results?.userAccounts || [];
        const accountName = accounts.find((account) => account?.accountName)?.accountName;
        if (accountName) return formatRoleLabel(accountName);

        if (platform?.isOwner) return 'Owner';

        // Path fallback for chit-fund staff shells
        const path = String(location.pathname || '');
        if (path.includes('/chit-fund/manager')) return 'Manager';
        if (path.includes('/chit-fund/collector')) return 'Collector';
        if (path.includes('/chit-fund/accountant')) return 'Accountant';
        if (path.includes('/chit-fund/user')) return 'User';

        return 'User';
    }, [
        platform?.activeContext?.roleCode,
        platform?.isOwner,
        userRole,
        user?.results?.userAccounts,
        location.pathname,
    ]);

    const getImageSrc = (userImage) => {
        if (!userImage) return "default-avatar.png"; // Fallback image
        return userImage.startsWith("data:image/") || userImage.startsWith("http")
            ? userImage
            : `data:image/jpeg;base64,${userImage}`;
    };

    /** ✅ Mobile Detection */
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024); // lg breakpoint is 1024px
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    /** ✅ Load User Data */
    useEffect(() => {
        console.log("🔥 useEffect triggered! Checking user image...");

        if (user?.results?.user_image) {


            const userImage = user.results.user_image;
            console.log("✅ user_image from DB:", userImage);

            if (userImage.includes("s3.ap-south-1.amazonaws.com")) {
                console.log("🔹 Fetching from AWS S3...");
                fetchImage(userImage);
            } else {
                console.log("✅ Using direct image URL:", userImage);
                setPreviewUrl(userImage); // Directly set image preview
            }
        } else {
            console.warn("⚠️ No user image found, using default.");
            setPreviewUrl('https://i.imgur.com/ndu6pfe.png');
        }
    }, [user?.results?.user_image]);

    /** ✅ Fetch Image from AWS */
    const fetchImage = async (user_image) => {
        if (!user_image) return;


        try {
            const imageKey = user_image.split('/').pop();
            console.log("🔹 Fetching image for key:", imageKey);
            const imageUrl = await downloadImage(imageKey, API_BASE_URL);

            console.log("✅ Downloaded Image URL:", imageUrl);

            if (imageUrl) {
                setPreviewUrl(imageUrl);
            } else {
                console.warn("⚠️ No valid image found, using default.");
                setPreviewUrl('https://i.imgur.com/ndu6pfe.png');
            }
        } catch (error) {
            console.error("❌ Error fetching image:", error);
            setPreviewUrl('https://i.imgur.com/ndu6pfe.png');
        }

    };

    const handleLogout = () => {
        logout();
        history.push("/");
    };

    const calculatePopupPosition = () => {
        if (typeof window !== 'undefined') {
            const screenWidth = window.innerWidth;
            const popupWidth = 224; // w-56 = 14rem = 224px
            const avatarPosition = 40; // Approximate avatar position from right edge

            if (isMobile) {
                // For mobile, center the popup or position it to avoid cutoff
                if (screenWidth < 400) {
                    // Very small screens - position to avoid left cutoff
                    setPopupPosition('-right-32');
                } else {
                    // Regular mobile - center it
                    setPopupPosition('-right-28');
                }
            } else {
                // Desktop logic
                if (avatarPosition + popupWidth > screenWidth - 20) {
                    // Position to the left of the avatar
                    setPopupPosition('-right-56');
                } else {
                    // Position to the right of the avatar
                    setPopupPosition('right-0');
                }
            }
        }
    };

    const showTooltip = () => {
        if (hideTooltipTimer.current) {
            clearTimeout(hideTooltipTimer.current);
            hideTooltipTimer.current = null;
        }
        calculatePopupPosition();
        setIsTooltipVisible(true);
    };
    const hideTooltip = () => {
        if (hideTooltipTimer.current) clearTimeout(hideTooltipTimer.current);
        hideTooltipTimer.current = setTimeout(() => {
            setIsTooltipVisible(false);
            hideTooltipTimer.current = null;
        }, 200);
    };

    useEffect(() => () => {
        if (hideTooltipTimer.current) clearTimeout(hideTooltipTimer.current);
    }, []);

    // Icon mapping for menu items
    const getIconForMenuItem = (text) => {
        switch (text.toLowerCase()) {
            case 'personal settings':
                return <FaCog className="w-4 h-4" />;
            case 'subscribers':
                return <FaUsers className="w-4 h-4" />;
            case 'dashboard':
                return <FaTachometerAlt className="w-4 h-4" />;
            case 'receivables':
                return <FaMoneyBillWave className="w-4 h-4" />;
            case 'payables':
                return <FaCreditCard className="w-4 h-4" />;
            case 'admin settings':
                return <FaShieldAlt className="w-4 h-4" />;
            case 'ledger':
                return <FaBook className="w-4 h-4" />;
            case 'products':
                return <FaBox className="w-4 h-4" />;
            default:
                return <FaUser className="w-4 h-4" />;
        }
    };

    return (
        <div className="flex items-center space-x-4">
            {user ? (
                <>
                    <div className="flex items-center space-x-3">
                        <div className={`hidden sm:block text-right ${scrolled ? 'text-white' : 'text-gray-700'}`}>
                            <p className="text-sm font-semibold truncate max-w-[10rem]">
                                Hi {displayName}
                            </p>
                            <p className={`text-xs ${scrolled ? 'text-red-100' : 'text-gray-500'}`}>
                                Logged in as {roleLabel}
                            </p>
                        </div>
                        <div className="relative" onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
                            <button
                                type="button"
                                onClick={() => isTooltipVisible ? setIsTooltipVisible(false) : showTooltip()}
                                onFocus={showTooltip}
                                aria-haspopup="menu"
                                aria-expanded={isTooltipVisible}
                                aria-label={`Open user menu, logged in as ${roleLabel}`}
                                className="block w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300 hover:border-red-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all duration-300 cursor-pointer"
                            >
                                <img
                                    src={image || previewUrl}
                                    alt={displayName || "User Avatar"}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                            {isTooltipVisible && (
                                <>
                                    {/* Invisible bridge to prevent hover gap - mobile: above, desktop: below */}
                                    <div className={`absolute w-56 h-2 ${isMobile ? 'bottom-10' : 'top-10'} ${popupPosition}`} style={{ zIndex: 9998 }} onMouseEnter={showTooltip} onMouseLeave={hideTooltip}></div>
                                    <div className={`absolute w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 ${isMobile ? 'bottom-10' : 'top-10'} ${popupPosition}`} style={{ zIndex: 9999 }} onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
                                        <div className="px-4 py-2 border-b border-gray-100">
                                            <p className="text-sm font-semibold text-gray-800">
                                                Hi {displayName}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                Logged in as {roleLabel}
                                            </p>
                                            {user.results.email ? (
                                                <p className="text-xs text-gray-400 mt-1 truncate">{user.results.email}</p>
                                            ) : null}
                                        </div>
                                        <ul className="py-1">
                                            {hasPermission(userRole, 'viewPersonalSettings') && (
                                                <li>
                                                    <Link
                                                        to="/chit-fund/user/personalsettings"
                                                        onClick={closeSidebar}
                                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                                                    >
                                                        {getIconForMenuItem('Personal Settings')}
                                                        Personal Settings
                                                    </Link>
                                                </li>
                                            )}
                                            {hasPermission(userRole, 'viewSubscribers') && (
                                                <li>
                                                    <Link
                                                        to="/subscribers"
                                                        onClick={closeSidebar}
                                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                                                    >
                                                        {getIconForMenuItem('Subscribers')}
                                                        Subscribers
                                                    </Link>
                                                </li>
                                            )}
                                            {hasPermission(userRole, 'viewDashboard') && (
                                                <li>
                                                    <Link
                                                        to="/dashboard"
                                                        onClick={closeSidebar}
                                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                                                    >
                                                        {getIconForMenuItem('Dashboard')}
                                                        Dashboard
                                                    </Link>
                                                </li>
                                            )}
                                            {hasPermission(userRole, 'viewReceivables') && (
                                                <li>
                                                    <Link
                                                        to="/receivables"
                                                        onClick={closeSidebar}
                                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                                                    >
                                                        {getIconForMenuItem('Receivables')}
                                                        Receivables
                                                    </Link>
                                                </li>
                                            )}
                                            {hasPermission(userRole, 'viewPayables') && (
                                                <li>
                                                    <Link
                                                        to="/payables"
                                                        onClick={closeSidebar}
                                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                                                    >
                                                        {getIconForMenuItem('Payables')}
                                                        Payables
                                                    </Link>
                                                </li>
                                            )}
                                            {hasPermission(userRole, 'viewAdminSettings') && (
                                                <li>
                                                    <Link
                                                        to="/chit-fund/user/adminsettings"
                                                        onClick={closeSidebar}
                                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                                                    >
                                                        {getIconForMenuItem('Admin Settings')}
                                                        Admin Settings
                                                    </Link>
                                                </li>
                                            )}
                                            {hasPermission(userRole, 'viewAdminSettings') && (
                                                <li>
                                                    <Link
                                                        to="/ledger"
                                                        onClick={closeSidebar}
                                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                                                    >
                                                        {getIconForMenuItem('Ledger')}
                                                        Ledger
                                                    </Link>
                                                </li>
                                            )}
                                            {hasPermission(userRole, 'viewAdminSettings') && (
                                                <li>
                                                    <Link
                                                        to="/products"
                                                        onClick={closeSidebar}
                                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                                                    >
                                                        {getIconForMenuItem('Products')}
                                                        Products
                                                    </Link>
                                                </li>
                                            )}
                                        </ul>
                                        <div className="border-t border-gray-100 pt-1">
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                                            >
                                                <FaUserMinus className="w-4 h-4" />
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex items-center space-x-3">
                    <Link
                        to="/login"
                        onClick={closeSidebar}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${scrolled
                            ? 'text-white hover:text-red-100 hover:bg-white/10'
                            : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                            }`}
                    >
                        <FaSignInAlt className="w-4 h-4" />
                        Login
                    </Link>
                    <Link
                        to="/signup"
                        onClick={closeSidebar}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${scrolled
                            ? 'bg-white text-red-600 hover:bg-red-50'
                            : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                    >
                        <FaUserPlus className="w-4 h-4" />
                        Signup
                    </Link>
                </div>
            )}
        </div>
    );
};

export default CartButtons;
