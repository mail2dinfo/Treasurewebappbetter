import React, { useState, useEffect } from 'react';
import { useSubscriberContext } from '../../context/subscriber/SubscriberContext';
import { useLanguage } from '../../context/language_context';
import LanguageSelector from '../../components/LanguageSelector';
import { downloadImage } from '../../utils/downloadImage';
import { API_BASE_URL } from '../../utils/apiConfig';

const SubscriberProfile = () => {
    const { user, loading } = useSubscriberContext();
    const { t } = useLanguage();
    const [image] = useState('');
    const [previewUrl, setPreviewUrl] = useState('https://i.imgur.com/ndu6pfe.png'); // Default image
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        email: '',
        phone: '',
        dob: '',
        gender: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                firstname: user.firstname || '',
                lastname: user.lastname || '',
                email: user.email || '',
                phone: user.phone || '',
                dob: user.dob || '',
                gender: user.gender || ''
            });
        }
    }, [user]);

    /** ✅ Load User Image - Same logic as SubscriberHeader */
    useEffect(() => {
        if (user?.user_image_s3_image) {
            const userImage = user.user_image_s3_image;

            if (userImage.includes("s3.ap-south-1.amazonaws.com")) {
                fetchImage(userImage);
            } else {
                setPreviewUrl(userImage); // Directly set image preview
            }
        } else {
            setPreviewUrl('https://i.imgur.com/ndu6pfe.png');
        }
    }, [user?.user_image_s3_image]);

    /** ✅ Fetch Image from AWS - Same logic as SubscriberHeader */
    const fetchImage = async (user_image) => {
        if (!user_image) return;

        try {
            const imageKey = user_image.split('/').pop();
            const imageUrl = await downloadImage(imageKey, API_BASE_URL);

            if (imageUrl) {
                setPreviewUrl(imageUrl);
            } else {
                setPreviewUrl('https://i.imgur.com/ndu6pfe.png');
            }
        } catch (error) {
            setPreviewUrl('https://i.imgur.com/ndu6pfe.png');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-12">
                    <div className="text-center sm:text-left mb-4 sm:mb-0">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            {t('profile')}
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl">
                            {t('personal_information')}
                        </p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <LanguageSelector />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            {/* Profile Header */}
                            <div className="bg-gradient-to-r from-red-500 to-red-600 p-8 text-white text-center">
                                <div className="relative inline-block">
                                    {image || previewUrl ? (
                                        <img
                                            src={image || previewUrl}
                                            alt="Profile"
                                            className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                                            onError={(e) => {
                                                e.target.src = 'https://i.imgur.com/ndu6pfe.png';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-white bg-opacity-20 flex items-center justify-center">
                                            <span className="text-3xl font-bold text-white">
                                                {user?.firstname?.charAt(0) || 'U'}
                                            </span>
                                        </div>
                                    )}
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                                        <span className="text-white text-sm">✓</span>
                                    </div>
                                </div>
                                <h2 className="text-2xl font-bold mt-4 mb-2">
                                    {user?.firstname} {user?.lastname}
                                </h2>
                                <p className="text-red-100 text-sm font-medium mb-1">Subscriber</p>
                                <p className="text-red-200 text-sm">{user?.phone}</p>
                            </div>

                            {/* Edit Profile Button Removed - Users not allowed to edit their own profile */}
                        </div>
                    </div>

                    {/* Profile Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                                <h3 className="text-xl font-semibold text-gray-900">{t('personal_information')}</h3>
                                <p className="text-sm text-gray-600 mt-1">Update your personal details and contact information</p>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* First Name */}
                                    <div className="space-y-2">
                                        <label htmlFor="firstname" className="block text-sm font-medium text-gray-700">
                                            {t('first_name')}
                                        </label>
                                        <input
                                            type="text"
                                            id="firstname"
                                            name="firstname"
                                            value={formData.firstname}
                                            disabled={true}
                                            className="w-full px-4 py-3 border border-gray-200 bg-gray-50 text-gray-500 rounded-xl"
                                            placeholder="First name"
                                        />
                                    </div>

                                    {/* Last Name */}
                                    <div className="space-y-2">
                                        <label htmlFor="lastname" className="block text-sm font-medium text-gray-700">
                                            {t('last_name')}
                                        </label>
                                        <input
                                            type="text"
                                            id="lastname"
                                            name="lastname"
                                            value={formData.lastname}
                                            disabled={true}
                                            className="w-full px-4 py-3 border border-gray-200 bg-gray-50 text-gray-500 rounded-xl"
                                            placeholder="Last name"
                                        />
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                            {t('email')}
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            disabled={true}
                                            className="w-full px-4 py-3 border border-gray-200 bg-gray-50 text-gray-500 rounded-xl"
                                            placeholder="Email address"
                                        />
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-2">
                                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                            {t('phone_number')}
                                        </label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={formData.phone}
                                            disabled={true}
                                            className="w-full px-4 py-3 border border-gray-200 bg-gray-50 text-gray-500 rounded-xl"
                                            placeholder="Phone number"
                                        />
                                    </div>

                                    {/* Date of Birth */}
                                    <div className="space-y-2">
                                        <label htmlFor="dob" className="block text-sm font-medium text-gray-700">
                                            {t('date_of_birth')}
                                        </label>
                                        <input
                                            type="date"
                                            id="dob"
                                            name="dob"
                                            value={formData.dob}
                                            disabled={true}
                                            className="w-full px-4 py-3 border border-gray-200 bg-gray-50 text-gray-500 rounded-xl"
                                        />
                                    </div>

                                    {/* Gender */}
                                    <div className="space-y-2">
                                        <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                                            {t('gender')}
                                        </label>
                                        <select
                                            id="gender"
                                            name="gender"
                                            value={formData.gender}
                                            disabled={true}
                                            className="w-full px-4 py-3 border border-gray-200 bg-gray-50 text-gray-500 rounded-xl"
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Save/Cancel Buttons Removed - Users not allowed to edit profile */}
                            </div>
                        </div>

                        {/* Account Settings Section Removed - Users not allowed to manage account settings */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriberProfile;
