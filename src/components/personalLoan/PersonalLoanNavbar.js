import React, { useState, useEffect } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { useUserContext } from '../../context/user_context';
import { FiMenu, FiX, FiLogOut, FiHome, FiUser, FiSettings, FiBarChart, FiUsers, FiDollarSign, FiCreditCard, FiShield, FiBook } from 'react-icons/fi';
import { API_BASE_URL } from '../../utils/apiConfig';
import { downloadImage } from "../../utils/downloadImage";

const PersonalLoanNavbar = () => {
    const history = useHistory();
    const location = useLocation();
    const { user, logout } = useUserContext();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const [image, setImage] = useState('');
    const [previewUrl, setPreviewUrl] = useState('https://i.imgur.com/ndu6pfe.png');
    const [isMobile, setIsMobile] = useState(false);
    const [popupPosition, setPopupPosition] = useState('right-0');

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.pageYOffset;
            setIsScrolled(scrollTop > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (user) {
            fetchImage();
        }
    }, [user]);

    const getImageSrc = (userImage) => {
        if (!userImage) return "default-avatar.png";
        return userImage.startsWith("data:image/") || userImage.startsWith("http")
            ? userImage
            : `${API_BASE_URL}/uploads/${userImage}`;
    };

    const fetchImage = async () => {
        try {
            // Try user_image_s3_image first (like AppSelectionPage)
            if (user?.results?.userDetail?.user_image_s3_image) {
                setImage(user.results.userDetail.user_image_s3_image);
                setPreviewUrl(user.results.userDetail.user_image_s3_image);
            } 
            // Try user_image_s3_image at root level
            else if (user?.results?.user_image_s3_image) {
                setImage(user.results.user_image_s3_image);
                setPreviewUrl(user.results.user_image_s3_image);
            }
            // Try userDetail.userImage
            else if (user?.results?.userDetail?.userImage) {
                const imageUrl = getImageSrc(user.results.userDetail.userImage);
                try {
                    const downloadedImage = await downloadImage(imageUrl);
                    if (downloadedImage) {
                        setImage(downloadedImage);
                        setPreviewUrl(downloadedImage);
                    } else {
                        setImage(imageUrl);
                        setPreviewUrl(imageUrl);
                    }
                } catch (err) {
                    setImage(imageUrl);
                    setPreviewUrl(imageUrl);
                }
            }
            // Try user_image at root level
            else if (user?.results?.user_image) {
                const imageUrl = getImageSrc(user.results.user_image);
                try {
                    const downloadedImage = await downloadImage(imageUrl);
                    if (downloadedImage) {
                        setImage(downloadedImage);
                        setPreviewUrl(downloadedImage);
                    } else {
                        setImage(imageUrl);
                        setPreviewUrl(imageUrl);
                    }
                } catch (err) {
                    setImage(imageUrl);
                    setPreviewUrl(imageUrl);
                }
            } 
            else {
                setPreviewUrl('https://i.imgur.com/ndu6pfe.png');
            }
        } catch (error) {
            console.error("❌ Error fetching image:", error);
            setPreviewUrl('https://i.imgur.com/ndu6pfe.png');
        }
    };

    const calculatePopupPosition = () => {
        if (typeof window !== 'undefined') {
            const screenWidth = window.innerWidth;
            const popupWidth = 224;
            const avatarPosition = 40;

            if (isMobile) {
                if (screenWidth < 400) {
                    setPopupPosition('-right-32');
                } else {
                    setPopupPosition('-right-28');
                }
            } else {
                if (avatarPosition + popupWidth > screenWidth - 20) {
                    setPopupPosition('-right-56');
                } else {
                    setPopupPosition('right-0');
                }
            }
        }
    };

    const showTooltip = () => {
        calculatePopupPosition();
        setIsTooltipVisible(true);
    };
    const hideTooltip = () => setIsTooltipVisible(false);

    const handleLogout = () => {
        logout();
        history.push('/login');
    };

    const handleBackToHub = () => {
        history.push('/app-selection');
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    const menuItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            path: '/personal-loan/user/dashboard',
            icon: '📊'
        },
        {
            id: 'company',
            label: 'Company',
            path: '/personal-loan/user/company',
            icon: '🏢'
        },
        {
            id: 'subscribers',
            label: 'Subscribers',
            path: '/personal-loan/user/subscribers',
            icon: '👥'
        },
        {
            id: 'loans',
            label: 'Loans',
            path: '/personal-loan/user/loans',
            icon: '💰'
        },
        {
            id: 'ledger',
            label: 'Ledger',
            path: '/personal-loan/user/ledger',
            icon: '📊'
        }
    ];

    const handleMenuClick = (path) => {
        history.push(path);
        setIsMobileMenuOpen(false);
    };

    return (
        <header className={`bg-white border-b-2 border-custom-red sticky top-0 z-50 transition-shadow duration-300 ${isScrolled ? 'shadow-md' : 'shadow-sm'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-14">
                    {/* Logo and Brand */}
                    <div className="flex items-center space-x-3">
                        <Link to="/personal-loan/user/dashboard" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-custom-red rounded-lg flex items-center justify-center">
                                <span className="text-white text-lg font-bold">💰</span>
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="text-lg font-bold text-custom-red">Personal Loan App</h1>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-1">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleMenuClick(item.path)}
                                className={`
                                    px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
                                    ${isActive(item.path)
                                        ? 'bg-custom-red text-white'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }
                                `}
                            >
                                <span className="mr-2">{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    {/* Right Side Actions */}
                    <div className="flex items-center space-x-3">
                        {/* Back to Hub Button */}
                        <button
                            onClick={handleBackToHub}
                            className="hidden sm:flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-custom-red hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <FiHome className="w-4 h-4 mr-1.5" />
                            <span>Finance Hub</span>
                        </button>

                        {/* User Info - Desktop */}
                        <div className="hidden sm:flex items-center space-x-3">
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">
                                    {user?.results?.userDetail?.userName || user?.results?.firstname || user?.results?.name || 'User'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {user?.results?.userDetail?.userRole || user?.results?.userDetail?.role || 'User'}
                                </p>
                            </div>
                            <div className="relative">
                                <button
                                    onClick={showTooltip}
                                    onMouseLeave={hideTooltip}
                                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300 hover:border-custom-red transition-colors focus:outline-none focus:ring-2 focus:ring-custom-red focus:ring-offset-2"
                                >
                                    <img
                                        src={image || previewUrl}
                                        alt={user?.results?.userDetail?.userName || user?.results?.firstname || user?.results?.name || 'User'}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://i.imgur.com/ndu6pfe.png';
                                        }}
                                    />
                                </button>

                                {/* User Dropdown */}
                                {isTooltipVisible && (
                                    <div className={`absolute ${popupPosition} mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50`}>
                                        <div className="px-4 py-3 border-b border-gray-200">
                                            <p className="text-sm font-semibold text-gray-900">
                                                {user?.results?.userDetail?.userName || user?.results?.firstname || user?.results?.name || 'User'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {user?.results?.userDetail?.userRole || user?.results?.userDetail?.role || 'User'}
                                            </p>
                                        </div>
                                        <button
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

                        {/* User Avatar - Mobile */}
                        <div className="sm:hidden relative">
                            <button
                                onClick={showTooltip}
                                onMouseLeave={hideTooltip}
                                className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300 hover:border-custom-red transition-colors focus:outline-none focus:ring-2 focus:ring-custom-red focus:ring-offset-2"
                            >
                                <img
                                    src={image || previewUrl}
                                    alt={user?.results?.userDetail?.userName || user?.results?.firstname || user?.results?.name || 'User'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://i.imgur.com/ndu6pfe.png';
                                    }}
                                />
                            </button>

                            {/* User Dropdown - Mobile */}
                            {isTooltipVisible && (
                                <div className={`absolute ${popupPosition} mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50`}>
                                    <div className="px-4 py-3 border-b border-gray-200">
                                        <p className="text-sm font-semibold text-gray-900">
                                            {user?.results?.userDetail?.userName || user?.results?.firstname || user?.results?.name || 'User'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {user?.results?.userDetail?.userRole || user?.results?.userDetail?.role || 'User'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                                    >
                                        <FiLogOut className="w-4 h-4 mr-2" />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none"
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? (
                                <FiX className="w-6 h-6" />
                            ) : (
                                <FiMenu className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-gray-200 bg-white">
                    <div className="px-4 py-3 space-y-1">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleMenuClick(item.path)}
                                className={`
                                    w-full px-4 py-3 rounded-lg font-medium text-left transition-all duration-200
                                    ${isActive(item.path)
                                        ? 'bg-custom-red text-white'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }
                                `}
                            >
                                <span className="mr-3">{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                        <button
                            onClick={handleBackToHub}
                            className="w-full px-4 py-3 rounded-lg font-medium text-left text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                            <FiHome className="w-4 h-4 mr-3" />
                            Finance Hub
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
};

export default PersonalLoanNavbar;
