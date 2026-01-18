import React, { useEffect, useState } from 'react';
import { usePersonalLoanContext } from '../../context/personalLoan/PersonalLoanContext';
import PersonalLoanSubscriberForm from '../../components/personalLoan/PersonalLoanSubscriberForm';
import { FiPlus, FiEdit2, FiTrash2, FiPhone, FiMapPin, FiUser, FiAlertCircle, FiImage, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';

const PersonalLoanSubscribersPage = () => {
    const {
        subscribers,
        isLoading,
        error,
        fetchSubscribers,
        createSubscriber,
        updateSubscriber,
        deleteSubscriber,
        clearError,
    } = usePersonalLoanContext();

    const [showForm, setShowForm] = useState(false);
    const [editingSubscriber, setEditingSubscriber] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [previewImageUrl, setPreviewImageUrl] = useState(null);

    useEffect(() => {
        fetchSubscribers();
    }, [fetchSubscribers]);

    const handleAddClick = () => {
        setEditingSubscriber(null);
        setShowForm(true);
    };

    const handleEditClick = (subscriber) => {
        setEditingSubscriber(subscriber);
        setShowForm(true);
    };

    const handleDeleteClick = (subscriber) => {
        setDeleteConfirm(subscriber);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm) return;

        try {
            const result = await deleteSubscriber(deleteConfirm.pl_cust_id);
            if (result.success) {
                toast.success('Subscriber deleted successfully');
                setDeleteConfirm(null);
            } else {
                toast.error(result.error || 'Failed to delete subscriber');
            }
        } catch (error) {
            toast.error('Failed to delete subscriber');
            console.error('Delete error:', error);
        }
    };

    const handleFormSave = async (formData) => {
        setFormLoading(true);
        try {
            let result;
            if (editingSubscriber) {
                result = await updateSubscriber(editingSubscriber.pl_cust_id, formData);
            } else {
                result = await createSubscriber(formData);
            }

            if (result.success) {
                toast.success(`Subscriber ${editingSubscriber ? 'updated' : 'created'} successfully`);
                setShowForm(false);
                setEditingSubscriber(null);
                fetchSubscribers(); // Refresh list
            } else {
                toast.error(result.error || `Failed to ${editingSubscriber ? 'update' : 'create'} subscriber`);
            }
        } catch (error) {
            toast.error(`Failed to ${editingSubscriber ? 'update' : 'create'} subscriber`);
            console.error('Save error:', error);
        } finally {
            setFormLoading(false);
        }
    };

    const handleFormCancel = () => {
        setShowForm(false);
        setEditingSubscriber(null);
    };

    const handleImagePreview = (subscriber, imageType) => {
        let imageUrl = null;
        if (imageType === 'photo') {
            imageUrl = subscriber.pl_cust_photo_s3_image || subscriber.pl_cust_photo;
        } else if (imageType === 'aadhaarFront') {
            imageUrl = subscriber.pl_cust_aadhaar_frontside_s3_image || subscriber.pl_cust_aadhaar_frontside;
        } else if (imageType === 'aadhaarBack') {
            imageUrl = subscriber.pl_cust_aadhaar_backside_s3_image || subscriber.pl_cust_aadhaar_backside;
        }

        if (imageUrl) {
            setPreviewImageUrl(imageUrl);
            setImagePreview(true);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Personal Loan Subscribers</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Manage your Personal Loan subscribers
                        </p>
                    </div>
                    <button
                        onClick={handleAddClick}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <FiPlus className="w-5 h-5" />
                        <span className="hidden sm:inline">Add Subscriber</span>
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-red-800 mb-1">Error</h3>
                            <p className="text-sm text-red-600">{error}</p>
                            <button
                                onClick={clearError}
                                className="text-xs text-red-600 hover:text-red-800 mt-2 underline"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && subscribers.length === 0 && (
                    <div className="flex justify-center items-center py-20">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading subscribers...</p>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && subscribers.length === 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiUser className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Subscribers Found</h3>
                        <p className="text-gray-600 mb-6">
                            Get started by adding your first Personal Loan subscriber
                        </p>
                        <button
                            onClick={handleAddClick}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            <FiPlus className="w-5 h-5" />
                            Add Your First Subscriber
                        </button>
                    </div>
                )}

                {/* Subscribers Grid */}
                {!isLoading && subscribers.length > 0 && (
                    <>
                        {/* Stats Summary */}
                        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FiUser className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Total Subscribers</p>
                                    <p className="text-2xl font-bold text-gray-800">{subscribers.length}</p>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Subscriber
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            DOB / Age
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Address
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Nominee
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Documents
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {subscribers.map((subscriber) => (
                                        <tr key={subscriber.pl_cust_id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {subscriber.pl_cust_photo_s3_image ? (
                                                        <img
                                                            src={subscriber.pl_cust_photo_s3_image}
                                                            alt={subscriber.pl_cust_name}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <span className="text-blue-600 font-bold text-sm">
                                                                {(subscriber.pl_cust_name || 'U').charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {subscriber.pl_cust_name || 'N/A'}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            ID: {subscriber.pl_cust_id?.substring(0, 8)}...
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-600">
                                                    <p>{subscriber.pl_cust_dob || 'N/A'}</p>
                                                    {subscriber.pl_cust_age && (
                                                        <p className="text-xs text-gray-500">Age: {subscriber.pl_cust_age}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-start gap-2 text-sm text-gray-600 max-w-xs">
                                                    <FiMapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                    <span className="line-clamp-2">
                                                        {subscriber.pl_cust_address || 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-600">
                                                    <p>{subscriber.pl_nominee_name || 'N/A'}</p>
                                                    {subscriber.pl_nominee_phone && (
                                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                                            <FiPhone className="w-3 h-3" />
                                                            {subscriber.pl_nominee_phone}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {subscriber.pl_cust_aadhaar_frontside_s3_image && (
                                                        <button
                                                            onClick={() => handleImagePreview(subscriber, 'aadhaarFront')}
                                                            className="text-blue-600 hover:text-blue-800 text-xs"
                                                            title="View Aadhaar Front"
                                                        >
                                                            <FiImage className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {subscriber.pl_cust_aadhaar_backside_s3_image && (
                                                        <button
                                                            onClick={() => handleImagePreview(subscriber, 'aadhaarBack')}
                                                            className="text-blue-600 hover:text-blue-800 text-xs"
                                                            title="View Aadhaar Back"
                                                        >
                                                            <FiImage className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {!subscriber.pl_cust_aadhaar_frontside_s3_image && !subscriber.pl_cust_aadhaar_backside_s3_image && (
                                                        <span className="text-xs text-gray-400">No docs</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEditClick(subscriber)}
                                                        className="text-blue-600 hover:text-blue-800 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <FiEdit2 className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(subscriber)}
                                                        className="text-red-600 hover:text-red-800 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <FiTrash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4">
                            {subscribers.map((subscriber) => (
                                <div
                                    key={subscriber.pl_cust_id}
                                    className="bg-white rounded-xl shadow-sm p-4 border border-gray-200"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-start gap-3 flex-1">
                                            {subscriber.pl_cust_photo_s3_image ? (
                                                <img
                                                    src={subscriber.pl_cust_photo_s3_image}
                                                    alt={subscriber.pl_cust_name}
                                                    className="w-12 h-12 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="text-blue-600 font-bold text-lg">
                                                        {(subscriber.pl_cust_name || 'U').charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 truncate">
                                                    {subscriber.pl_cust_name || 'N/A'}
                                                </h3>
                                                <p className="text-xs text-gray-500">
                                                    ID: {subscriber.pl_cust_id?.substring(0, 12)}...
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEditClick(subscriber)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <FiEdit2 className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(subscriber)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <FiTrash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {subscriber.pl_cust_dob && (
                                            <div className="text-sm text-gray-600">
                                                <span className="font-medium">DOB: </span>
                                                {subscriber.pl_cust_dob}
                                                {subscriber.pl_cust_age && ` (Age: ${subscriber.pl_cust_age})`}
                                            </div>
                                        )}
                                        {subscriber.pl_cust_address && (
                                            <div className="flex items-start gap-2 text-sm text-gray-600">
                                                <FiMapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                <span className="line-clamp-2">{subscriber.pl_cust_address}</span>
                                            </div>
                                        )}
                                        {subscriber.pl_nominee_name && (
                                            <div className="text-sm text-gray-600">
                                                <span className="font-medium">Nominee: </span>
                                                {subscriber.pl_nominee_name}
                                                {subscriber.pl_nominee_phone && ` - ${subscriber.pl_nominee_phone}`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Form Modal */}
                {showForm && (
                    <PersonalLoanSubscriberForm
                        subscriber={editingSubscriber}
                        onSave={handleFormSave}
                        onCancel={handleFormCancel}
                        isLoading={formLoading}
                    />
                )}

                {/* Delete Confirmation Modal */}
                {deleteConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Confirm Delete</h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete <strong>{deleteConfirm.pl_cust_name}</strong>? This action cannot be undone.
                            </p>
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Image Preview Modal */}
                {imagePreview && previewImageUrl && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-gray-800">Image Preview</h3>
                                <button
                                    onClick={() => {
                                        setImagePreview(false);
                                        setPreviewImageUrl(null);
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <FiX className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="flex justify-center">
                                <img
                                    src={previewImageUrl}
                                    alt="Preview"
                                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PersonalLoanSubscribersPage;
