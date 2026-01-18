import React, { useState, useEffect } from 'react';
import { FiX, FiSave } from 'react-icons/fi';
import LogoUploader from '../dailyCollection/LogoUploader';
import { uploadImage } from '../../utils/uploadImage';
import { API_BASE_URL } from '../../utils/apiConfig';

const PersonalLoanCompanyForm = ({ company, onSave, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_no: '',
    address: '',
    company_logo: ''
  });

  const [errors, setErrors] = useState({});
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (company) {
      setFormData({
        company_name: company.company_name || '',
        contact_no: company.contact_no || '',
        address: company.address || '',
        company_logo: company.company_logo || ''
      });

      // Set preview URL if company has a logo
      if (company.company_logo_s3_image || company.company_logo) {
        setPreviewUrl(company.company_logo_s3_image || company.company_logo);
      }
    }
  }, [company]);

  const validate = () => {
    const newErrors = {};

    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required';
    }

    if (formData.contact_no && !/^[0-9]{10}$/.test(formData.contact_no.replace(/\s/g, ''))) {
      newErrors.contact_no = 'Contact number must be 10 digits';
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
  };

  const handleSetImage = (file) => {
    setImage(file);
    const fileURL = URL.createObjectURL(file);
    setPreviewUrl(fileURL);
  };

  const handleRemoveImage = () => {
    setImage(null);
    setPreviewUrl(null);
    setFormData(prev => ({ ...prev, company_logo: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validate()) {
      let logoUrl = formData.company_logo;

      // Upload new image if one was selected
      if (image) {
        try {
          logoUrl = await uploadImage(image, API_BASE_URL);
          if (!logoUrl) {
            setErrors({ company_logo: 'Failed to upload logo. Please try again.' });
            return;
          }
        } catch (error) {
          setErrors({ company_logo: 'Failed to upload logo. Please try again.' });
          return;
        }
      }

      const updatedFormData = {
        ...formData,
        company_logo: logoUrl
      };

      onSave(updatedFormData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-800">
            {company ? 'Edit Company' : 'Add New Company'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all ${errors.company_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Enter company name"
                disabled={isLoading}
              />
              {errors.company_name && (
                <p className="mt-1 text-sm text-red-500">{errors.company_name}</p>
              )}
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number
              </label>
              <input
                type="text"
                name="contact_no"
                value={formData.contact_no}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all ${errors.contact_no ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Enter 10-digit contact number"
                maxLength={10}
                disabled={isLoading}
              />
              {errors.contact_no && (
                <p className="mt-1 text-sm text-red-500">{errors.contact_no}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                placeholder="Enter company address"
                disabled={isLoading}
              />
            </div>

            {/* Company Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Logo
              </label>
              <LogoUploader
                handleSetImage={handleSetImage}
                currentImage={previewUrl}
                onRemove={handleRemoveImage}
              />
              {errors.company_logo && (
                <p className="mt-1 text-sm text-red-500">{errors.company_logo}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4" />
                  {company ? 'Update Company' : 'Create Company'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonalLoanCompanyForm;
