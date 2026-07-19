import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

const MyTreasureBrand = ({
    to,
    subtitle,
    inverse = false,
    className = '',
    onClick,
}) => {
    const content = (
        <>
            <span
                className="relative block h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg bg-red-600 shadow-sm sm:h-10 sm:w-10"
                aria-hidden="true"
            >
                <img
                    src={logo}
                    alt=""
                    className="pointer-events-none absolute max-w-none select-none"
                    style={{
                        height: '8rem',
                        width: '22.5rem',
                        left: '-0.8rem',
                        top: '-1rem',
                    }}
                />
            </span>
            <span className="min-w-0 leading-tight">
                <span className={`block whitespace-nowrap text-base font-bold sm:text-lg ${inverse ? 'text-white' : 'text-red-600'}`}>
                    MyTreasure
                </span>
                {subtitle && (
                    <span className={`block max-w-[9rem] truncate whitespace-nowrap text-[10px] font-medium sm:max-w-none sm:text-xs ${inverse ? 'text-red-100' : 'text-gray-500'}`}>
                        {subtitle}
                    </span>
                )}
            </span>
        </>
    );

    const sharedClassName = `inline-flex min-w-0 items-center gap-2 ${className}`.trim();

    if (to) {
        return (
            <Link
                to={to}
                onClick={onClick}
                className={sharedClassName}
                aria-label={subtitle ? `MyTreasure — ${subtitle}` : 'MyTreasure'}
            >
                {content}
            </Link>
        );
    }

    return <div className={sharedClassName}>{content}</div>;
};

export default MyTreasureBrand;
