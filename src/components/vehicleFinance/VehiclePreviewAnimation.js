import React from 'react';
import './VehiclePreviewAnimation.css';

const BikeSvg = () => (
    <svg width="72" height="48" viewBox="0 0 72 48" fill="none" aria-hidden="true">
        <g className="vf-bike-body">
            {/* rear wheel */}
            <circle cx="18" cy="36" r="10" stroke="#991b1b" strokeWidth="3" fill="#fff" className="vf-wheel" />
            <circle cx="18" cy="36" r="3" fill="#dc2626" />
            {/* front wheel */}
            <circle cx="54" cy="36" r="10" stroke="#991b1b" strokeWidth="3" fill="#fff" className="vf-wheel" />
            <circle cx="54" cy="36" r="3" fill="#dc2626" />
            {/* frame */}
            <path d="M18 36 L32 18 L46 18 L54 36" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M32 18 L38 10 L48 10" stroke="#991b1b" strokeWidth="3" strokeLinecap="round" />
            {/* seat & handle */}
            <rect x="28" y="14" width="14" height="4" rx="2" fill="#991b1b" />
            <path d="M48 10 L52 6" stroke="#991b1b" strokeWidth="2.5" strokeLinecap="round" />
        </g>
    </svg>
);

const CarSvg = () => (
    <svg width="96" height="52" viewBox="0 0 96 52" fill="none" aria-hidden="true">
        <g className="vf-car-body">
            {/* body */}
            <path
                d="M8 32 H88 C90 32 92 30 92 28 V22 C92 20 90 18 86 18 H62 L52 8 H28 L18 18 H8 C6 18 4 20 4 22 V28 C4 30 6 32 8 32 Z"
                fill="#dc2626"
                stroke="#991b1b"
                strokeWidth="2"
            />
            {/* windows */}
            <path d="M30 18 L38 10 H50 L58 18 H30 Z" fill="#fff" stroke="#991b1b" strokeWidth="1.5" />
            <rect x="62" y="18" width="18" height="10" rx="1" fill="#fff" stroke="#991b1b" strokeWidth="1.5" />
            {/* wheels */}
            <circle cx="24" cy="34" r="11" stroke="#991b1b" strokeWidth="3" fill="#fff" className="vf-wheel" />
            <circle cx="24" cy="34" r="4" fill="#dc2626" />
            <circle cx="72" cy="34" r="11" stroke="#991b1b" strokeWidth="3" fill="#fff" className="vf-wheel" />
            <circle cx="72" cy="34" r="4" fill="#dc2626" />
            {/* headlight */}
            <rect x="86" y="24" width="4" height="6" rx="1" fill="#fef2f2" />
        </g>
    </svg>
);

const VehiclePreviewAnimation = ({ vehicleType }) => {
    const isBike = vehicleType === 'TWO_WHEELER';
    const label = isBike ? 'Two Wheeler' : 'Four Wheeler';

    return (
        <div className="vf-preview-scene" role="img" aria-label={`${label} preview animation`}>
            <div className="absolute top-2 left-3 z-10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 bg-white/90 px-2 py-0.5 rounded-full border border-red-200">
                    {label}
                </span>
            </div>
            <div className={`vf-preview-vehicle ${isBike ? 'vf-preview-vehicle--bike' : 'vf-preview-vehicle--car'}`}>
                {!isBike && <span className="vf-exhaust" />}
                {isBike ? <BikeSvg /> : <CarSvg />}
            </div>
            <div className="vf-preview-road" />
        </div>
    );
};

export default VehiclePreviewAnimation;
