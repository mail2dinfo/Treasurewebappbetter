import React, { useState, useEffect } from 'react';
import imageCompression from 'browser-image-compression';

const ImageUpload = ({ initialImage, onImageChange }) => {
    const [previewUrl, setPreviewUrl] = useState('');
    const [, setCompressedImage] = useState(null);

    // Initialize with the existing image if provided
    useEffect(() => {
        if (initialImage) {
            setPreviewUrl(initialImage); // Base64 string or DB image URL
        }
    }, [initialImage]);

    // Compress the image
    const compressImage = async (file) => {
        const options = {
            maxSizeMB: 1, // Maximum size in MB
            maxWidthOrHeight: 800, // Maximum width or height
            useWebWorker: true,
        };

        try {
            const compressedFile = await imageCompression(file, options);
            const base64 = await imageCompression.getDataUrlFromFile(compressedFile);
            setCompressedImage(base64);
            onImageChange(base64); // Pass the compressed image to the parent
        } catch (error) {
            console.error('Image compression failed:', error);
        }
    };

    // Handle file selection
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const fileType = file.type;
            if (fileType.includes('png') || fileType.includes('jpg') || fileType.includes('jpeg')) {
                await compressImage(file);
                const reader = new FileReader();
                reader.onload = () => {
                    setPreviewUrl(reader.result); // Preview the selected image
                };
                reader.readAsDataURL(file);
            } else {
                alert('Please upload a valid image file (PNG, JPG, or JPEG).');
            }
        }
    };

    return (
        <div>
            {/* Display Preview */}
            {previewUrl && (
                <img
                    src={previewUrl}
                    alt="Preview"
                    style={{ width: '150px', height: '150px', objectFit: 'cover', marginBottom: '10px' }}
                />
            )}

            {/* File Upload Input */}
            <input
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleFileChange}
            />
        </div>
    );
};

export default ImageUpload;
