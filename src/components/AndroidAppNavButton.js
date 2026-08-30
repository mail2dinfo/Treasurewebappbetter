import React from 'react';
import { FaAndroid } from 'react-icons/fa';

export const ANDROID_APP_HREF = '/android.html';

const defaultClassName =
    'flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-custom-red hover:bg-gray-100 rounded-lg transition-colors';

/**
 * Opens the Android download page (APK + QR). Same control in every app navbar.
 */
const AndroidAppNavButton = ({
    className = defaultClassName,
    onClick,
    iconClassName = 'w-4 h-4 mr-1.5',
}) => (
    <a
        href={ANDROID_APP_HREF}
        onClick={onClick}
        className={className}
        aria-label="Download Android app"
        title="Download Android app"
    >
        <FaAndroid className={iconClassName} />
        <span className="hidden sm:inline">Android app</span>
    </a>
);

export default AndroidAppNavButton;
