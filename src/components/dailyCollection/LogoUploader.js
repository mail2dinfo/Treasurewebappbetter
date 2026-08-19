import React, { useEffect, useState } from "react";
import { FiCamera, FiBriefcase, FiUpload, FiX } from "react-icons/fi";

const LogoUploader = ({
    handleSetImage,
    currentImage,
    onRemove,
    label = "Company Logo",
    imageFit = "cover",
    disabled = false,
}) => {
    const [previewUrl, setPreviewUrl] = useState(currentImage);
    const [isHovered, setIsHovered] = useState(false);

    // Sync with parent state
    useEffect(() => {
        if (currentImage) {
            setPreviewUrl(currentImage);
        }
    }, [currentImage]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && (file.type.includes("png") || file.type.includes("jpg") || file.type.includes("jpeg"))) {
            const fileURL = URL.createObjectURL(file);
            setPreviewUrl(fileURL);
            handleSetImage(file);
        } else {
            alert("Please upload a valid image file (PNG or JPG).");
        }
    };

    const handleRemove = () => {
        setPreviewUrl(null);
        if (onRemove) {
            onRemove();
        }
    };

    return (
        <div className="text-center">
            <div
                className="relative inline-block group cursor-pointer"
                onMouseEnter={() => !disabled && setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Logo Container */}
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200 shadow-md bg-gray-50">
                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt={label}
                            className={`w-full h-full ${imageFit === "contain" ? "object-contain" : "object-cover"}`}
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                    ) : null}
                    <div
                        className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 ${previewUrl ? 'hidden' : 'flex'
                            }`}
                    >
                        <FiBriefcase className="w-8 h-8 text-gray-400" />
                    </div>

                    {/* Overlay on hover */}
                    {isHovered && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-200">
                            <div className="text-white text-center">
                                <FiUpload className="w-6 h-6 mx-auto mb-1" />
                                <p className="text-xs font-medium">Change Logo</p>
                            </div>
                        </div>
                    )}

                    {/* Remove button */}
                    {previewUrl && !disabled && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemove();
                            }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full shadow-lg flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                            <FiX className="w-3 h-3 text-white" />
                        </button>
                    )}
                </div>

                {/* Upload Button */}
                <label className={`absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 group ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:from-red-600 hover:to-red-700 transform hover:scale-110"}`}>
                    <input
                        type="file"
                        accept=".png, .jpg, .jpeg"
                        onChange={handleFileChange}
                        disabled={disabled}
                        className="hidden"
                    />
                    <FiCamera className="w-5 h-5 text-white" />
                </label>
            </div>

            {/* Instructions */}
            <div className="mt-4 space-y-1">
                <p className="text-sm text-gray-600 font-medium">{label}</p>
                <p className="text-xs text-gray-500">
                    Click the camera icon to upload a logo
                </p>
                <p className="text-xs text-gray-400">
                    Recommended: Square image, at least 200x200 pixels
                </p>
            </div>
        </div>
    );
};

export default LogoUploader;