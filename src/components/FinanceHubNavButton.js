import React from 'react';
import { Link } from 'react-router-dom';
import { FiGrid } from 'react-icons/fi';

const defaultClassName =
    'flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-custom-red hover:bg-gray-100 rounded-lg transition-colors';

/**
 * Shared Finance Hub control — same text + FiGrid icon as Daily Collection navbar.
 */
const FinanceHubNavButton = ({
    className = defaultClassName,
    onClick,
    iconClassName = 'w-4 h-4 mr-1.5',
}) => (
    <Link
        to="/app-selection"
        onClick={onClick}
        className={className}
        aria-label="Finance Hub"
    >
        <FiGrid className={iconClassName} />
        <span className="hidden sm:inline">Finance Hub</span>
        <span className="sm:hidden">Hub</span>
    </Link>
);

export default FinanceHubNavButton;
