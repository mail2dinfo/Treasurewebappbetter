import React, { useState, useEffect } from 'react';
import { useDailyCollectionContext } from '../../context/dailyCollection/DailyCollectionContext';
import ProductForm from '../../components/dailyCollection/ProductForm';
import { FiPlus, FiEdit2, FiTrash2, FiClock, FiPercent, FiX, FiGrid, FiList } from 'react-icons/fi';
import Loading from '../../components/Loading';

const ProductCard = ({ product, onEdit, onDelete, showActionLabels = false }) => (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border-2 border-gray-200">
        <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-gray-800 mb-1 break-words">{product.product_name}</h3>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${product.frequency === 'DAILY'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-purple-100 text-purple-700'
                    }`}>
                    {product.frequency}
                </span>
            </div>
            {!showActionLabels && (
                <div className="flex shrink-0 gap-1">
                    <button
                        type="button"
                        onClick={onEdit}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit"
                    >
                        <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                    >
                        <FiTrash2 className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>

        <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                    <FiClock className="w-4 h-4 text-green-600" />
                </div>
                <div className="min-w-0">
                    <p className="text-gray-500 text-xs">Duration</p>
                    <p className="font-semibold text-gray-800">{product.duration} cycles</p>
                </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                    <FiPercent className="w-4 h-4 text-orange-600" />
                </div>
                <div className="min-w-0">
                    <p className="text-gray-500 text-xs">Interest Rate</p>
                    <p className="font-semibold text-gray-800">
                        {parseFloat(product.interest_rate || 0).toFixed(2)}%
                    </p>
                </div>
            </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Example: ₹10,000 loan</p>
            <div className="flex justify-between text-xs">
                <span className="text-gray-600">Per cycle:</span>
                <span className="font-semibold text-gray-800">
                    ₹{(10000 / product.duration).toFixed(2)}
                </span>
            </div>
            {parseFloat(product.interest_rate || 0) > 0 && (
                <div className="flex justify-between text-xs mt-1">
                    <span className="text-gray-600">Cash in hand:</span>
                    <span className="font-semibold text-green-700">
                        ₹{(10000 - (10000 * parseFloat(product.interest_rate) / 100)).toFixed(2)}
                    </span>
                </div>
            )}
        </div>

        {showActionLabels && (
            <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={onEdit}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg"
                >
                    <FiEdit2 className="w-4 h-4" />
                    Edit
                </button>
                <button
                    type="button"
                    onClick={onDelete}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg"
                >
                    <FiTrash2 className="w-4 h-4" />
                    Delete
                </button>
            </div>
        )}
    </div>
);

const ProductManagement = () => {
    const { products, isLoading, error, fetchProducts, createProduct, updateProduct, deleteProduct, clearError } = useDailyCollectionContext();
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [viewMode, setViewMode] = useState('rows');

    useEffect(() => {
        console.log('ProductManagement: useEffect triggered, calling fetchProducts');
        fetchProducts();
    }, [fetchProducts]);

    // Debug logging
    useEffect(() => {
        console.log('ProductManagement: State updated', {
            products: products,
            isLoading: isLoading,
            error: error,
            productsLength: products?.length
        });
    }, [products, isLoading, error]);

    const handleCreate = () => {
        setEditingProduct(null);
        setShowForm(true);
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setShowForm(true);
    };

    const handleSave = async (productData) => {
        setFormLoading(true);

        let result;
        if (editingProduct) {
            result = await updateProduct(editingProduct.id, productData);
        } else {
            result = await createProduct(productData);
        }

        setFormLoading(false);

        if (result.success) {
            setShowForm(false);
            setEditingProduct(null);
        }
    };

    const handleDelete = async (productId) => {
        const result = await deleteProduct(productId);
        if (result.success) {
            setDeleteConfirm(null);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingProduct(null);
        clearError();
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Product Management</h1>
                        <p className="text-sm text-gray-600 mt-1">Manage loan products for Daily Collection</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                        <div className="hidden md:inline-flex w-full sm:w-auto rounded-lg border border-gray-300 overflow-hidden bg-white shadow-sm">
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${viewMode === 'grid'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                                title="Grid view"
                            >
                                <FiGrid className="w-4 h-4" />
                                <span>Grid</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('rows')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-l border-gray-300 ${viewMode === 'rows'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                                title="Rows view"
                            >
                                <FiList className="w-4 h-4" />
                                <span>Rows</span>
                            </button>
                        </div>
                        <button
                            onClick={handleCreate}
                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-md hover:shadow-lg justify-center"
                        >
                            <FiPlus className="w-5 h-5" />
                            Add Product
                        </button>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-red-800">Error</p>
                            <p className="text-sm text-red-600 mt-1">{error}</p>
                        </div>
                        <button onClick={clearError} className="text-red-500 hover:text-red-700">
                            <FiX className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && products.length === 0 && (
                    <div className="flex justify-center items-center py-20">
                        <div className="text-center">
                            <Loading />
                            <p className="text-gray-600">Loading products...</p>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && products.length === 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">📦</span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Products Yet</h3>
                        <p className="text-gray-600 mb-6">Create loan products like "100 Days Daily" to get started</p>
                        <button
                            onClick={handleCreate}
                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                        >
                            <FiPlus className="w-5 h-5" />
                            Create Your First Product
                        </button>
                    </div>
                )}

                {/* Products */}
                {!isLoading && products.length > 0 && (
                    <>
                    <div className="md:hidden space-y-3">
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onEdit={() => handleEdit(product)}
                                onDelete={() => setDeleteConfirm(product)}
                                showActionLabels
                            />
                        ))}
                    </div>
                    {viewMode === 'grid' ? (
                    <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onEdit={() => handleEdit(product)}
                                onDelete={() => setDeleteConfirm(product)}
                            />
                        ))}
                    </div>
                    ) : (
                    <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Frequency</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Duration</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Interest</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Per cycle (₹10,000)</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider sticky right-0 bg-gray-50">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {products.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-gray-800">{product.product_name}</p>
                                                {parseFloat(product.interest_rate || 0) > 0 && (
                                                    <p className="text-xs text-green-700 mt-0.5">
                                                        Cash in hand on ₹10,000: ₹{(10000 - (10000 * parseFloat(product.interest_rate) / 100)).toFixed(2)}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${product.frequency === 'DAILY'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-purple-100 text-purple-700'
                                                    }`}>
                                                    {product.frequency}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-800">{product.duration} cycles</td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-800">{parseFloat(product.interest_rate || 0).toFixed(2)}%</td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-800">
                                                ₹{(10000 / product.duration).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 sticky right-0 bg-white">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEdit(product)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <FiEdit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteConfirm(product)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <FiTrash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    )}
                    </>
                )}

                {/* Product Form Modal */}
                {showForm && (
                    <ProductForm
                        product={editingProduct}
                        onSave={handleSave}
                        onCancel={handleCancel}
                        isLoading={formLoading}
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
                                    Delete Product
                                </h3>
                                <p className="text-sm text-gray-600 text-center">
                                    Are you sure you want to delete <strong>{deleteConfirm.product_name}</strong>?
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

export default ProductManagement;



