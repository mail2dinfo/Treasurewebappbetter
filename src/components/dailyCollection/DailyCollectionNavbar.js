import React, { useState, useEffect } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { useUserContext } from '../../context/user_context';
import { FiMenu, FiX, FiLogOut, FiHome, FiUser, FiSettings, FiBarChart, FiUsers, FiDollarSign, FiCreditCard, FiShield, FiBook, FiBox } from 'react-icons/fi';
import { API_BASE_URL } from '../../utils/apiConfig';
import { downloadImage } from "../../utils/downloadImage";
import MyTreasureBrand from '../MyTreasureBrand';

const DailyCollectionNavbar = () => {
    const history = useHistory();
    const location = useLocation();
    const { user, logout } = useUserContext();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const [image, setImage] = useState('');
    const [previewUrl, setPreviewUrl] = useState('https://i.imgur.com/ndu6pfe.png'); // Default image
    const [isMobile, setIsMobile] = useState(false);
    const [popupPosition, setPopupPosition] = useState('right-0');

    // Handle scroll behavior
    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.pageYOffset;
            setIsScrolled(scrollTop > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Check if mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Fetch user image
    useEffect(() => {
        if (user?.results?.userDetail?.userImage) {
            fetchImage();
        }
    }, [user]);

    const getImageSrc = (userImage) => {
        if (!userImage) return "default-avatar.png"; // Fallback image
        return userImage.startsWith("data:image/") || userImage.startsWith("http")
            ? userImage
            : `${API_BASE_URL}/uploads/${userImage}`;
    };

    const fetchImage = async () => {
        try {
            if (user?.results?.userDetail?.userImage) {
                const imageUrl = getImageSrc(user.results.userDetail.userImage);
                const downloadedImage = await downloadImage(imageUrl);
                setImage(downloadedImage);
                setPreviewUrl(downloadedImage);
            } else {
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
        calculatePopupPosition();
        setIsTooltipVisible(true);
    };
    const hideTooltip = () => setIsTooltipVisible(false);

    // Icon mapping for menu items
    const getIconForMenuItem = (text) => {
        switch (text.toLowerCase()) {
            case 'personal settings':
                return <FiSettings className="w-4 h-4" />;
            case 'subscribers':
                return <FiUsers className="w-4 h-4" />;
            case 'dashboard':
                return <FiBarChart className="w-4 h-4" />;
            case 'receivables':
                return <FiDollarSign className="w-4 h-4" />;
            case 'payables':
                return <FiCreditCard className="w-4 h-4" />;
            case 'admin settings':
                return <FiShield className="w-4 h-4" />;
            case 'ledger':
                return <FiBook className="w-4 h-4" />;
            case 'products':
                return <FiBox className="w-4 h-4" />;
            default:
                return <FiUser className="w-4 h-4" />;
        }
    };


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
            path: '/daily-collection/user/dashboard',
            icon: '📊'
        },
        {
            id: 'company',
            label: 'Company',
            path: '/daily-collection/user/company',
            icon: '🏢'
        },
        {
            id: 'subscribers',
            label: 'Subscribers',
            path: '/daily-collection/user/subscribers',
            icon: '👥'
        },
        {
            id: 'products',
            label: 'Products',
            path: '/daily-collection/user/products',
            icon: '📦'
        },
        {
            id: 'loans',
            label: 'Loans',
            path: '/daily-collection/user/loans',
            icon: '💰'
        },
        {
            id: 'ledger',
            label: 'Ledger',
            path: '/daily-collection/user/ledger',
            icon: '📊'
        },
        {
            id: 'collections',
            label: 'Collections',
            path: '/daily-collection/user/collections',
            icon: '💰'
        },
        {
            id: 'reports',
            label: 'Reports',
            path: '/daily-collection/user/reports',
            icon: '📈'
        }
    ];

    const handleMenuClick = (path) => {
        history.push(path);
        setIsMobileMenuOpen(false);
    };

    return (
        <header className={`bg-white border-b border-gray-200 sticky top-0 z-50 transition-all duration-200 ${isScrolled ? 'shadow-lg' : 'shadow-sm'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-14">
                    <MyTreasureBrand subtitle="Daily Collection" />

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-1">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleMenuClick(item.path)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 flex items-center space-x-1.5 ${isActive(item.path)
                                    ? 'bg-red-500 text-white'
                                    : 'text-gray-700 hover:text-red-500 hover:bg-red-50'
                                    }`}
                            >
                                <span className="text-base">{item.icon}</span>
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>

                    {/* User Profile & Actions */}
                    <div className="flex items-center space-x-2">
                        {/* User Display - Simple image and name */}
                        <div className="flex items-center space-x-2">
                            <div className="text-sm font-medium text-gray-700">
                                Hi {user?.results?.userDetail?.userName || user?.results?.firstname || user?.results?.name || "Guest"}
                            </div>
                            <div className="relative" onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
                                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300 hover:border-red-500 transition-all duration-300 cursor-pointer">
                                    <img
                                        src={image || previewUrl}
                                        alt={user?.results?.userDetail?.userName || user?.results?.firstname || "User Avatar"}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.src = 'https://i.imgur.com/ndu6pfe.png';
                                        }}
                                    />
                                </div>
                                {isTooltipVisible && (
                                    <>
                                        {/* Invisible bridge to prevent hover gap */}
                                        <div className={`absolute w-56 h-2 z-40 ${isMobile ? 'bottom-10' : 'top-10'} ${popupPosition}`} onMouseEnter={showTooltip} onMouseLeave={hideTooltip}></div>
                                        <div className={`absolute w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 ${isMobile ? 'bottom-10' : 'top-10'} ${popupPosition}`} onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
                                            <div className="px-4 py-2 border-b border-gray-100">
                                                <p className="text-sm font-semibold text-gray-800">
                                                    {user?.results?.userDetail?.userName || user?.results?.firstname || user?.results?.name || "User"}
                                                </p>
                                                <p className="text-xs text-gray-500">{user?.results?.email}</p>
                                            </div>
                                            <ul className="py-1">
                                                <li>
                                                    <Link
                                                        to="/daily-collection/user/personalsettings"
                                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                                                    >
                                                        {getIconForMenuItem('Personal Settings')}
                                                        Personal Settings
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        to="/daily-collection/user/dashboard"
                                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                                                    >
                                                        {getIconForMenuItem('Dashboard')}
                                                        Dashboard
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        to="/daily-collection/user/subscribers"
                                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                                                    >
                                                        {getIconForMenuItem('Subscribers')}
                                                        Subscribers
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        to="/daily-collection/user/products"
                                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                                                    >
                                                        {getIconForMenuItem('Products')}
                                                        Products
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        to="/daily-collection/user/loans"
                                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                                                    >
                                                        {getIconForMenuItem('Loans')}
                                                        Loans
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        to="/daily-collection/user/ledger"
                                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                                                    >
                                                        {getIconForMenuItem('Ledger')}
                                                        Ledger
                                                    </Link>
                                                </li>
                                            </ul>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Back to Hub Button */}
                        <button
                            onClick={handleBackToHub}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 flex items-center space-x-1.5"
                            title="Back to Finance Hub"
                        >
                            <FiHome className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Hub</span>
                        </button>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 flex items-center space-x-1.5"
                        >
                            <FiLogOut className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-1.5 rounded-md text-gray-600 hover:text-red-500 hover:bg-red-50 transition-colors duration-150"
                        >
                            {isMobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 bg-white">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleMenuClick(item.path)}
                                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${isActive(item.path)
                                        ? 'bg-red-500 text-white shadow-md'
                                        : 'text-gray-600 hover:text-red-500 hover:bg-red-50'
                                        }`}
                                >
                                    <span className="text-xl">{item.icon}</span>
                                    <span>{item.label}</span>
                                </button>
                            ))}

                            {/* Back to Hub in Mobile Menu */}
                            <button
                                onClick={handleBackToHub}
                                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 text-gray-600 hover:text-red-500 hover:bg-red-50"
                            >
                                <FiHome className="w-5 h-5" />
                                <span>Back to Finance Hub</span>
                            </button>
                        </div>

                        {/* Mobile User Info */}
                        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center border-2 border-gray-200">
                                    <span className="text-white text-lg font-bold">
                                        {(user?.results?.userDetail?.userName || user?.results?.firstname || user?.results?.name || 'User').charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                        Welcome, {user?.results?.userDetail?.userName || user?.results?.firstname || user?.results?.name || 'User'}!
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Daily Collection Admin
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default DailyCollectionNavbar;
