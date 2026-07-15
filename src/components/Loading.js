import React from 'react';

const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-[3px]',
    lg: 'h-14 w-14 border-4',
};

const Loading = ({ size = 'md', className = '' }) => {
    return (
        <div className={`flex items-center justify-center ${className}`} role="status" aria-label="Loading">
            <div
                className={`animate-spin rounded-full border-red-600 border-t-transparent ${sizeClasses[size] || sizeClasses.md}`}
            />
        </div>
    );
};

export default Loading;
