import React, { useState, useEffect } from 'react';
import { useVehicleFinanceContext } from '../../context/vehicleFinance/VehicleFinanceContext';
import VehicleFinanceCompanyForm from '../../components/vehicleFinance/VehicleFinanceCompanyForm';
import { getVfCompanyLogoUrl } from '../../components/vehicleFinance/vfCompanyLogo';
import { FiPlus, FiEdit2, FiTrash2, FiPhone, FiMapPin, FiAlertCircle, FiX, FiBriefcase } from 'react-icons/fi';
import { useVfPermission } from '../../components/vehicleFinance/useVfPermission';

const VehicleFinanceCompanyManagement = () => {
    const { companies, isLoading, error, fetchCompanies, createCompany, updateCompany, deleteCompany, clearError } = useVehicleFinanceContext();
    const { canAccess } = useVfPermission();
    // Granular only: legacy coarse `vf_company` still grants add/edit via permission expansion.
    const canAddCompany = canAccess('vf_company_add');
    const canEditCompany = canAccess('vf_company_edit');
    const canDeleteCompany = canEditCompany;

    console.log('VehicleFinanceCompanyManagement: companies:', companies);
    console.log('VehicleFinanceCompanyManagement: isLoading:', isLoading);
    console.log('VehicleFinanceCompanyManagement: error:', error);
    const [showForm, setShowForm] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [logoUrls, setLogoUrls] = useState({});

    useEffect(() => {
        console.log('VehicleFinanceCompanyManagement: Fetching companies...');
        fetchCompanies();
    }, [fetchCompanies]);

    // Resolve displayable logo URLs from API (signed S3 / base64)
    useEffect(() => {
        if (companies.length > 0) {
            const urls = {};
            companies.forEach((company) => {
                urls[company.id] = getVfCompanyLogoUrl(company);
            });
            setLogoUrls(urls);
        }
    }, [companies]);

    const handleCreate = () => {
        setEditingCompany(null);
        setShowForm(true);
    };

    const handleEdit = (company) => {
        setEditingCompany(company);
        setShowForm(true);
    };

    const handleSave = async (companyData) => {
        setFormLoading(true);
        clearError();

        let result;
        if (editingCompany) {
            result = await updateCompany(editingCompany.id, companyData);
        } else {
            result = await createCompany(companyData);
        }

        setFormLoading(false);

        if (result.success) {
            setShowForm(false);
            setEditingCompany(null);
            await fetchCompanies();
        }
    };

    const handleDelete = async (companyId) => {
        const result = await deleteCompany(companyId);
        if (result.success) {
            setDeleteConfirm(null);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingCompany(null);
        clearError();
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Company Management</h1>
                        <p className="text-sm text-gray-600 mt-1">Manage companies for Vehicle Finance</p>
                    </div>
                    {canAddCompany && (
                        <button
                            onClick={handleCreate}
                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-md hover:shadow-lg justify-center"
                        >
                            <FiPlus className="w-5 h-5" />
                            Add Company
                        </button>
                    )}
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-red-800">Error</p>
                            <p className="text-sm text-red-600 mt-1">{error}</p>
                        </div>
                        <button
                            onClick={clearError}
                            className="text-red-500 hover:text-red-700"
                        >
                            <FiX className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && companies.length === 0 && (
                    <div className="flex justify-center items-center py-20">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading companies...</p>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && companies.length === 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">🏢</span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Companies Yet</h3>
                        <p className="text-gray-600 mb-6">Get started by creating your first company</p>
                        {error && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 text-sm">Error: {error}</p>
                                <p className="text-red-500 text-xs mt-1">Check console for more details</p>
                            </div>
                        )}
                        {canAddCompany && (
                            <button
                                onClick={handleCreate}
                                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                            >
                                <FiPlus className="w-5 h-5" />
                                Add Your First Company
                            </button>
                        )}
                    </div>
                )}

                {/* Desktop Table View */}
                {!isLoading && companies.length > 0 && (
                    <>
                        <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Company Name
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Contact
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Address
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {companies.map((company) => (
                                        <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                        {logoUrls[company.id] ? (
                                                            <img
                                                                src={logoUrls[company.id]}
                                                                alt={`${company.company_name} logo`}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                    e.target.nextSibling.style.display = 'flex';
                                                                }}
                                                            />
                                                        ) : null}
                                                        <div className={`w-full h-full flex items-center justify-center ${logoUrls[company.id] ? 'hidden' : 'flex'}`}>
                                                            <FiBriefcase className="w-5 h-5 text-red-600" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{company.company_name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <FiPhone className="w-4 h-4" />
                                                    {company.contact_no || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-start gap-2 text-sm text-gray-600">
                                                    <FiMapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                    <span className="line-clamp-2">{company.address || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {canEditCompany && (
                                                        <button
                                                            onClick={() => handleEdit(company)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <FiEdit2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {canDeleteCompany && (
                                                        <button
                                                            onClick={() => setDeleteConfirm(company)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <FiTrash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4">
                            {companies.map((company) => (
                                <div
                                    key={company.id}
                                    className="bg-white rounded-xl shadow-sm p-4 border border-gray-200"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                {logoUrls[company.id] ? (
                                                    <img
                                                        src={logoUrls[company.id]}
                                                        alt={`${company.company_name} logo`}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <div className={`w-full h-full flex items-center justify-center ${logoUrls[company.id] ? 'hidden' : 'flex'}`}>
                                                    <FiBriefcase className="w-6 h-6 text-red-600" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 truncate">
                                                    {company.company_name}
                                                </h3>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 ml-2">
                                            {canEditCompany && (
                                                <button
                                                    onClick={() => handleEdit(company)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <FiEdit2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            {canDeleteCompany && (
                                                <button
                                                    onClick={() => setDeleteConfirm(company)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <FiTrash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {company.contact_no && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <FiPhone className="w-4 h-4 flex-shrink-0" />
                                                <span>{company.contact_no}</span>
                                            </div>
                                        )}
                                        {company.address && (
                                            <div className="flex items-start gap-2 text-sm text-gray-600">
                                                <FiMapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                <span className="line-clamp-2">{company.address}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Company Form Modal */}
                {showForm && (
                    <VehicleFinanceCompanyForm
                        company={editingCompany}
                        onSave={handleSave}
                        onCancel={handleCancel}
                        isLoading={formLoading}
                        error={error}
                    />
                )}

                {/* Delete Confirmation Modal */}
                {deleteConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                            <div className="mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FiTrash2 className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
                                    Delete Company
                                </h3>
                                <p className="text-sm text-gray-600 text-center">
                                    Are you sure you want to delete <strong>{deleteConfirm.company_name}</strong>?
                                    This action cannot be undone.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm.id)}
                                    className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VehicleFinanceCompanyManagement;
