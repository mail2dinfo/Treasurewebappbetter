import React, { useState, useEffect, useCallback } from 'react';
import { FiX, FiSave, FiUpload, FiTrash2 } from 'react-icons/fi';
import { uploadImage } from '../../utils/uploadImage';
import { API_BASE_URL } from '../../utils/apiConfig';
import FixedMapPicker from '../FixedMapPicker';
import SimpleLocationPicker from '../SimpleLocationPicker';

const PersonalLoanSubscriberForm = ({ subscriber, onSave, onCancel, isLoading }) => {
    const [formData, setFormData] = useState({
        pl_cust_name: '',
        pl_cust_dob: '',
        pl_cust_age: '',
        pl_cust_phone: '',
        pl_cust_photo: '',
        pl_cust_address: '',
        latitude: '',
        longitude: '',
        pl_cust_aadhaar_frontside: '',
        pl_cust_aadhaar_backside: '',
        pl_nominee_name: '',
        pl_nominee_phone: '',
    });

    const [errors, setErrors] = useState({});
    const [, setImageFiles] = useState({
        photo: null,
        aadhaarFront: null,
        aadhaarBack: null,
    });
    const [previewUrls, setPreviewUrls] = useState({
        photo: null,
        aadhaarFront: null,
        aadhaarBack: null,
    });
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [useSimplePicker, setUseSimplePicker] = useState(false);
    const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);

    useEffect(() => {
        if (subscriber) {
            setFormData({
                pl_cust_name: subscriber.pl_cust_name || '',
                pl_cust_dob: subscriber.pl_cust_dob || '',
                pl_cust_age: subscriber.pl_cust_age || '',
                pl_cust_phone: subscriber.pl_cust_phone || '',
                pl_cust_photo: subscriber.pl_cust_photo || '',
                pl_cust_address: subscriber.pl_cust_address || '',
                latitude: subscriber.latitude ? subscriber.latitude.toString() : '',
                longitude: subscriber.longitude ? subscriber.longitude.toString() : '',
                pl_cust_aadhaar_frontside: subscriber.pl_cust_aadhaar_frontside || '',
                pl_cust_aadhaar_backside: subscriber.pl_cust_aadhaar_backside || '',
                pl_nominee_name: subscriber.pl_nominee_name || '',
                pl_nominee_phone: subscriber.pl_nominee_phone || '',
            });

            // Set preview URLs from existing subscriber (using _s3_image suffix for display)
            if (subscriber.pl_cust_photo_s3_image) {
                setPreviewUrls(prev => ({ ...prev, photo: subscriber.pl_cust_photo_s3_image }));
            } else if (subscriber.pl_cust_photo) {
                setPreviewUrls(prev => ({ ...prev, photo: subscriber.pl_cust_photo }));
            }

            if (subscriber.pl_cust_aadhaar_frontside_s3_image) {
                setPreviewUrls(prev => ({ ...prev, aadhaarFront: subscriber.pl_cust_aadhaar_frontside_s3_image }));
            } else if (subscriber.pl_cust_aadhaar_frontside) {
                setPreviewUrls(prev => ({ ...prev, aadhaarFront: subscriber.pl_cust_aadhaar_frontside }));
            }

            if (subscriber.pl_cust_aadhaar_backside_s3_image) {
                setPreviewUrls(prev => ({ ...prev, aadhaarBack: subscriber.pl_cust_aadhaar_backside_s3_image }));
            } else if (subscriber.pl_cust_aadhaar_backside) {
                setPreviewUrls(prev => ({ ...prev, aadhaarBack: subscriber.pl_cust_aadhaar_backside }));
            }
        }
    }, [subscriber]);

    const validate = () => {
        const newErrors = {};

        if (!formData.pl_cust_name.trim()) {
            newErrors.pl_cust_name = 'Subscriber name is required';
        }

        if (formData.pl_cust_age && (isNaN(formData.pl_cust_age) || formData.pl_cust_age < 0)) {
            newErrors.pl_cust_age = 'Age must be a valid number';
        }

        if (formData.pl_cust_phone && !/^[0-9]{10}$/.test(formData.pl_cust_phone.replace(/\s/g, ''))) {
            newErrors.pl_cust_phone = 'Subscriber mobile must be 10 digits';
        }

        if (formData.pl_nominee_phone && !/^[0-9]{10}$/.test(formData.pl_nominee_phone.replace(/\s/g, ''))) {
            newErrors.pl_nominee_phone = 'Nominee mobile must be 10 digits';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }

        // Auto-calculate age from DOB
        if (name === 'pl_cust_dob' && value) {
            const dob = new Date(value);
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const monthDiff = today.getMonth() - dob.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                age--;
            }
            setFormData(prev => ({ ...prev, pl_cust_age: age }));
        }
    };

    const handleImageChange = async (field, file) => {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setErrors(prev => ({ ...prev, [field]: 'Please select a valid image file' }));
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, [field]: 'Image size must be less than 5MB' }));
            return;
        }

        // Set preview
        const fileURL = URL.createObjectURL(file);
        setPreviewUrls(prev => ({ ...prev, [field]: fileURL }));
        setImageFiles(prev => ({ ...prev, [field]: file }));

        // Clear error
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }

        // Upload image immediately
        try {
            const imageUrl = await uploadImage(file, API_BASE_URL);
            if (imageUrl) {
                // Map field names to form data keys
                const fieldMap = {
                    photo: 'pl_cust_photo',
                    aadhaarFront: 'pl_cust_aadhaar_frontside',
                    aadhaarBack: 'pl_cust_aadhaar_backside',
                };
                setFormData(prev => ({
                    ...prev,
                    [fieldMap[field]]: imageUrl
                }));
            } else {
                setErrors(prev => ({ ...prev, [field]: 'Failed to upload image. Please try again.' }));
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            setErrors(prev => ({ ...prev, [field]: 'Failed to upload image. Please try again.' }));
        }
    };

    const handleRemoveImage = (field) => {
        setImageFiles(prev => ({ ...prev, [field]: null }));
        setPreviewUrls(prev => ({ ...prev, [field]: null }));

        const fieldMap = {
            photo: 'pl_cust_photo',
            aadhaarFront: 'pl_cust_aadhaar_frontside',
            aadhaarBack: 'pl_cust_aadhaar_backside',
        };
        setFormData(prev => ({
            ...prev,
            [fieldMap[field]]: ''
        }));
    };

    // Location picker handlers
    const handleLocationSelect = useCallback((lat, lng) => {
        setFormData(prev => ({
            ...prev,
            latitude: lat.toString(),
            longitude: lng.toString(),
        }));
    }, []);

    const openMapPicker = () => {
        setIsMapOpen(true);
        setUseSimplePicker(false);
    };

    const openSimplePicker = () => {
        setIsMapOpen(true);
        setUseSimplePicker(true);
    };

    const closeMapPicker = useCallback(() => {
        setIsMapOpen(false);
        setUseSimplePicker(false);
    }, []);

    // Geocoding: Convert address to coordinates
    const geocodeAddress = async () => {
        const address = formData.pl_cust_address;

        if (!address || address.trim().length === 0) {
            alert('Please enter an address first to locate on map');
            return;
        }

        setIsGeocodingLoading(true);

        try {
            // Use OpenStreetMap Nominatim API (free, no API key required)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'TreasureApp/1.0' // Required by Nominatim
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Geocoding service unavailable');
            }

            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                setFormData(prev => ({
                    ...prev,
                    latitude: lat,
                    longitude: lon,
                }));
                alert(`✅ Location found!\n\nAddress: ${address}\nCoordinates: ${parseFloat(lat).toFixed(6)}, ${parseFloat(lon).toFixed(6)}`);
            } else {
                alert('❌ Location not found. Please try:\n- Adding more address details\n- Checking spelling\n- Using the map picker to select manually');
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            alert('❌ Unable to locate address. Please use the map picker to select location manually.');
        } finally {
            setIsGeocodingLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validate()) {
            await onSave(formData);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {subscriber ? 'Edit Subscriber' : 'Add New Subscriber'}
                    </h2>
                    <button
                        onClick={onCancel}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Personal Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="pl_cust_name"
                                    value={formData.pl_cust_name}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.pl_cust_name ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter subscriber name"
                                />
                                {errors.pl_cust_name && (
                                    <p className="text-red-500 text-xs mt-1">{errors.pl_cust_name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date of Birth
                                </label>
                                <input
                                    type="date"
                                    name="pl_cust_dob"
                                    value={formData.pl_cust_dob}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Age
                                </label>
                                <input
                                    type="number"
                                    name="pl_cust_age"
                                    value={formData.pl_cust_age}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.pl_cust_age ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Auto-calculated from DOB"
                                />
                                {errors.pl_cust_age && (
                                    <p className="text-red-500 text-xs mt-1">{errors.pl_cust_age}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Subscriber Mobile Number
                                </label>
                                <input
                                    type="text"
                                    name="pl_cust_phone"
                                    value={formData.pl_cust_phone}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.pl_cust_phone ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter subscriber 10 digit mobile number"
                                    maxLength="10"
                                />
                                {errors.pl_cust_phone && (
                                    <p className="text-red-500 text-xs mt-1">{errors.pl_cust_phone}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">Subscriber's own mobile number</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Address
                            </label>
                            <textarea
                                name="pl_cust_address"
                                value={formData.pl_cust_address}
                                onChange={handleChange}
                                rows="3"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                placeholder="Enter full address"
                            />
                        </div>
                    </div>

                    {/* Location Coordinates */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Location Coordinates</h3>

                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm">🗺️</span>
                                </div>
                                <h4 className="text-lg font-semibold text-gray-800">
                                    Location Coordinates
                                </h4>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm text-gray-600">
                                    Select your exact location on the map for precise coordinates
                                </p>

                                {/* Auto-Locate from Address Button */}
                                <div className="bg-white rounded-xl p-4 border border-blue-200">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-2xl">🎯</span>
                                        <div className="flex-1">
                                            <h5 className="text-sm font-semibold text-gray-800">Auto-Locate from Address</h5>
                                            <p className="text-xs text-gray-600">Automatically find coordinates based on your address</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={geocodeAddress}
                                        disabled={isGeocodingLoading || !formData.pl_cust_address.trim()}
                                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:from-green-700 hover:to-emerald-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-600/30 flex items-center justify-center gap-2 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        {isGeocodingLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                Searching...
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-lg">🔍</span>
                                                Find My Location from Address
                                            </>
                                        )}
                                    </button>
                                    {!formData.pl_cust_address.trim() && (
                                        <p className="text-xs text-amber-600 mt-2 text-center">
                                            💡 Fill in address above first
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={openMapPicker}
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-600/30 flex items-center justify-center gap-2"
                                    >
                                        <span className="text-lg">🗺️</span>
                                        {formData.latitude && formData.longitude ? 'Update Location on Map' : 'Select Location on Map'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={openSimplePicker}
                                        className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:from-green-700 hover:to-emerald-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-600/30 flex items-center justify-center gap-2"
                                    >
                                        <span className="text-lg">📍</span>
                                        {formData.latitude && formData.longitude ? 'Update Coordinates' : 'Enter Coordinates'}
                                    </button>
                                </div>

                                <div className="bg-white rounded-xl p-4 border border-blue-200" style={{ minHeight: '88px' }}>
                                    {(formData.latitude && formData.longitude) ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                    Latitude
                                                </label>
                                                <div className="px-3 py-2 bg-gray-50 rounded-lg border text-sm font-mono">
                                                    {formData.latitude}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                    Longitude
                                                </label>
                                                <div className="px-3 py-2 bg-gray-50 rounded-lg border text-sm font-mono">
                                                    {formData.longitude}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-sm text-gray-500">
                                            Coordinates will appear here after selection
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Photo Upload */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Photo</h3>
                        <div className="flex items-start gap-4">
                            {previewUrls.photo && (
                                <div className="relative">
                                    <img
                                        src={previewUrls.photo}
                                        alt="Subscriber"
                                        className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage('photo')}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                    >
                                        <FiTrash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Upload Photo
                                </label>
                                <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-500 transition-colors">
                                    <div className="text-center">
                                        <FiUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                                        <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleImageChange('photo', e.target.files[0])}
                                    />
                                </label>
                                {errors.pl_cust_photo && (
                                    <p className="text-red-500 text-xs mt-1">{errors.pl_cust_photo}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Aadhaar Cards */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Aadhaar Card</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Front Side */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Front Side
                                </label>
                                {previewUrls.aadhaarFront && (
                                    <div className="relative mb-2">
                                        <img
                                            src={previewUrls.aadhaarFront}
                                            alt="Aadhaar front"
                                            className="w-full h-48 object-cover rounded-lg border border-gray-300"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage('aadhaarFront')}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                                <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-500 transition-colors">
                                    <div className="text-center">
                                        <FiUpload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                                        <p className="text-xs text-gray-600">Upload Front Side</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleImageChange('aadhaarFront', e.target.files[0])}
                                    />
                                </label>
                                {errors.pl_cust_aadhaar_frontside && (
                                    <p className="text-red-500 text-xs mt-1">{errors.pl_cust_aadhaar_frontside}</p>
                                )}
                            </div>

                            {/* Back Side */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Back Side
                                </label>
                                {previewUrls.aadhaarBack && (
                                    <div className="relative mb-2">
                                        <img
                                            src={previewUrls.aadhaarBack}
                                            alt="Aadhaar back"
                                            className="w-full h-48 object-cover rounded-lg border border-gray-300"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage('aadhaarBack')}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                                <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-500 transition-colors">
                                    <div className="text-center">
                                        <FiUpload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                                        <p className="text-xs text-gray-600">Upload Back Side</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleImageChange('aadhaarBack', e.target.files[0])}
                                    />
                                </label>
                                {errors.pl_cust_aadhaar_backside && (
                                    <p className="text-red-500 text-xs mt-1">{errors.pl_cust_aadhaar_backside}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Nominee Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Nominee Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nominee Name
                                </label>
                                <input
                                    type="text"
                                    name="pl_nominee_name"
                                    value={formData.pl_nominee_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    placeholder="Enter nominee name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nominee Mobile Number
                                </label>
                                <input
                                    type="text"
                                    name="pl_nominee_phone"
                                    value={formData.pl_nominee_phone}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.pl_nominee_phone ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter nominee 10 digit mobile number"
                                    maxLength="10"
                                />
                                {errors.pl_nominee_phone && (
                                    <p className="text-red-500 text-xs mt-1">{errors.pl_nominee_phone}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">This is the nominee's mobile number, not the subscriber's</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FiSave className="w-4 h-4" />
                                    {subscriber ? 'Update' : 'Create'} Subscriber
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Location Picker Modals */}
                {isMapOpen && (
                    <>
                        {useSimplePicker ? (
                            <SimpleLocationPicker
                                latitude={formData.latitude}
                                longitude={formData.longitude}
                                onLocationSelect={handleLocationSelect}
                                isOpen={isMapOpen}
                                onClose={closeMapPicker}
                            />
                        ) : (
                            <FixedMapPicker
                                latitude={formData.latitude}
                                longitude={formData.longitude}
                                onLocationSelect={handleLocationSelect}
                                isOpen={isMapOpen}
                                onClose={closeMapPicker}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default PersonalLoanSubscriberForm;
