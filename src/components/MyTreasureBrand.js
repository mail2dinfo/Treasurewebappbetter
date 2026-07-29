import React from 'react';
import { Link } from 'react-router-dom';
import TreasureBoxLogo from './TreasureBoxLogo';

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
                className="relative flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center"
                aria-hidden="true"
            >
                <TreasureBoxLogo
                    variant={inverse ? 'inverse' : 'brand'}
                    className="h-full w-full drop-shadow-sm"
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
