import React, { useState, useEffect } from 'react';
import { useHistory, NavLink } from 'react-router-dom';
import { FiHome, FiLogOut } from 'react-icons/fi';
import { useUserContext } from '../../context/user_context';
import MyTreasureBrand from '../MyTreasureBrand';
import FinanceHubNavButton from '../FinanceHubNavButton';
import { HM_RESIDENT_BASE_PATH } from './hostelManagementMenuItems';
import { API_BASE_URL } from '../../utils/apiConfig';
import { downloadImage } from '../../utils/downloadImage';

const navButtonClass =
  'flex items-center px-3 py-1.5 text-sm font-medium text-white hover:text-red-100 hover:bg-white/10 rounded-lg transition-colors';

const capitalizeName = (value) => {
  const name = String(value || '').trim();
  if (!name) return 'Resident';
  return name.charAt(0).toUpperCase() + name.slice(1);
};

/** Top bar: Home + Finance Hub only (modules live in app menu). */
const HostelManagementResidentNavbar = () => {
  const history = useHistory();
  const { user, logout } = useUserContext();
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('https://i.imgur.com/ndu6pfe.png');
  const dashboardPath = `${HM_RESIDENT_BASE_PATH}/dashboard`;

  const displayName = capitalizeName(
    user?.results?.firstname || user?.results?.userDetail?.userName || user?.results?.name || 'Resident'
  );

  useEffect(() => {
    const fetchImage = async () => {
      try {
        if (user?.results?.userDetail?.user_image_s3_image) {
          setPreviewUrl(user.results.userDetail.user_image_s3_image);
        } else if (user?.results?.user_image_s3_image) {
          setPreviewUrl(user.results.user_image_s3_image);
        } else if (user?.results?.userDetail?.userImage) {
          const imageUrl = user.results.userDetail.userImage.startsWith('http')
            ? user.results.userDetail.userImage
            : `${API_BASE_URL}/uploads/${user.results.userDetail.userImage}`;
          const downloadedImage = await downloadImage(imageUrl);
          setPreviewUrl(downloadedImage || imageUrl);
        }
      } catch {
        setPreviewUrl('https://i.imgur.com/ndu6pfe.png');
      }
    };
    if (user) fetchImage();
  }, [user]);

  return (
    <header className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <MyTreasureBrand to={dashboardPath} subtitle="Hostel · Resident" inverse />
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button type="button" onClick={() => history.push(dashboardPath)} className={navButtonClass}>
              <FiHome className="w-4 h-4 mr-1.5" />
              <span>Home</span>
            </button>
            <FinanceHubNavButton className={navButtonClass} />
            <div className="hidden sm:block text-right px-2 border-l border-white/30">
              <p className="text-sm font-semibold text-white truncate max-w-[10rem]">Hi {displayName}</p>
              <p className="text-xs text-red-100">Logged in as Resident</p>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTooltipVisible(!isTooltipVisible)}
                onBlur={() => setTimeout(() => setIsTooltipVisible(false), 150)}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/50 hover:border-white transition-colors"
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
                    <p className="text-sm font-semibold text-gray-900">Hi {displayName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Logged in as Resident</p>
                  </div>
                  <NavLink
                    to="/app-selection"
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Finance Hub
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      history.push('/login');
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50 flex items-center"
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

export default HostelManagementResidentNavbar;
