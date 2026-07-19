import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaChevronDown, FaChevronUp, FaSave, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useProductContext } from '../context/product_context';
import { usePlatformAccess } from '../context/platformAccess_context';

const ProductsPage = () => {
  const platform = usePlatformAccess();
  const enforceProductAccess = platform?.isAvailable && !platform.isOwner;
  const canAddProduct = !enforceProductAccess || platform.hasPermission('chit_product_add');
  const canEditProduct = !enforceProductAccess || platform.hasPermission('chit_product_edit');
  const canDeleteProduct = !enforceProductAccess || platform.hasPermission('chit_product_delete');
  const {
    state: { products, loading, error },
    addProduct,
    updateProduct,
    deleteProduct,
    isProductNameUnique,
    membershipId,
    loadProducts
  } = useProductContext();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProductMasterCollapsed, setIsProductMasterCollapsed] = useState(false);
  const [isDraftMode, setIsDraftMode] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Products are loaded automatically by the context when user logs in

  // Auto-select the most recently created/updated product after database refresh
  useEffect(() => {
    if (products.length > 0 && !selectedProduct && !loading) {
      const mostRecentProduct = products[0];
      setSelectedProduct(mostRecentProduct);
    }
  }, [products.length, selectedProduct, loading]);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    productName: '',
    product: '',
    tenure: '',
    status: 'DRAFT'
  });
  const [monthlyDetails, setMonthlyDetails] = useState([]);
  const [modalMonthlyDetails, setModalMonthlyDetails] = useState([]); // Separate state for modal
  const [formErrors, setFormErrors] = useState({});
  const [tenureSortOrder, setTenureSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [modalTenureSortOrder, setModalTenureSortOrder] = useState('asc'); // 'asc' or 'desc' for modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [editingRow, setEditingRow] = useState(null); // Track which row is being edited (format: "rowIndex")
  const [showRowEditModal, setShowRowEditModal] = useState(false);
  const [editingRowData, setEditingRowData] = useState(null);
  const [editingRowIndexModal, setEditingRowIndexModal] = useState(null);

  // Generate empty monthly details when tenure changes (only for create mode)
  useEffect(() => {
    // Only auto-generate for create mode, edit mode is handled in handleFormDataChange
    if (isCreateModalOpen && formData.tenure && parseInt(formData.tenure) > 0) {
      const months = parseInt(formData.tenure);
      const newMonthlyDetails = Array.from({ length: months }, (_, index) => ({
        sequence: index + 1,
        bid: '',
        prize: '',
        comm: '',
        bal: '',
        profit: '',
        due: ''
      }));
      setMonthlyDetails(newMonthlyDetails);
      setModalMonthlyDetails(newMonthlyDetails);
      setHasUnsavedChanges(true);
    } else if (isCreateModalOpen && (!formData.tenure || parseInt(formData.tenure) <= 0)) {
      setMonthlyDetails([]);
      setModalMonthlyDetails([]);
    }
  }, [formData.tenure, isCreateModalOpen]);

  // Function to check if a draft product is complete and ready for activation
  const isDraftProductComplete = (product) => {
    if (!product) return false;

    const hasBasicInfo = product.productName &&
      product.product &&
      product.tenure &&
      product.tenure > 0;

    const hasMonthlyDetails = product.monthlyDetails &&
      product.monthlyDetails.length > 0 &&
      product.monthlyDetails.length === parseInt(product.tenure);

    return hasBasicInfo && hasMonthlyDetails;
  };

  // Function to activate a draft product
  const handleActivateProduct = async (product) => {
    try {
      if (!isDraftProductComplete(product)) {
        toast.error('Please complete all product details before activating.');
        return;
      }

      const updates = {
        productName: product.productName,
        product: product.product,
        tenure: product.tenure,
        membershipid: membershipId,
        status: 'ACTIVE',
        monthlyDetails: product.monthlyDetails
      };

      const response = await updateProduct(product.id, updates);

      if (response.ok) {
        toast.success('Product activated successfully!');
        if (selectedProduct && selectedProduct.id === product.id) {
          setSelectedProduct({
            ...selectedProduct,
            status: 'ACTIVE'
          });
        }
        // Refresh products list to show the updated status
        loadProducts();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to activate product. Please try again.');
      }
    } catch (error) {
      console.error('Error activating product:', error);
      toast.error('Failed to activate product. Please try again.');
    }
  };

  // Function to convert active product back to draft
  const handleMakeDraft = async (product) => {
    try {
      const updates = {
        productName: product.productName,
        product: product.product,
        tenure: product.tenure,
        membershipid: membershipId,
        status: 'DRAFT',
        monthlyDetails: product.monthlyDetails
      };

      const response = await updateProduct(product.id, updates);

      if (response.ok) {
        toast.success('Product converted to draft successfully!');
        if (selectedProduct && selectedProduct.id === product.id) {
          setSelectedProduct({
            ...selectedProduct,
            status: 'DRAFT'
          });
        }
        // Refresh products list to show the updated status
        loadProducts();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to convert product to draft. Please try again.');
      }
    } catch (error) {
      console.error('Error converting product to draft:', error);
      toast.error('Failed to convert product to draft. Please try again.');
    }
  };

  // Create Product Button Handler
  const handleCreateProduct = () => {
    if (!canAddProduct) {
      toast.error('Add Product permission is required');
      return;
    }
    setFormData({
      productName: '',
      product: '',
      tenure: '',
      status: 'DRAFT'
    });
    setMonthlyDetails([]);
    setModalMonthlyDetails([]); // Initialize modal state
    setFormErrors({});
    setIsDraftMode(true);
    setIsCreateModalOpen(true);
    setHasUnsavedChanges(false);
  };

  // Validate product name uniqueness
  const validateProductName = (productName, excludeId = null) => {
    if (!productName.trim()) {
      return 'Product name is required';
    }
    if (!isProductNameUnique(productName, excludeId)) {
      return 'Product name already exists. Please choose a different name.';
    }
    return '';
  };

  // Save Product (Partial or Full) with validation
  const handleSaveProduct = async () => {
    setFormErrors({});
    const errors = {};

    const nameError = validateProductName(formData.productName, editingProduct?.id);
    if (nameError) {
      errors.productName = nameError;
    }

    if (!formData.productName) {
      errors.productName = 'Product name is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      if (errors.general) {
        toast.error(errors.general);
      }
      return;
    }

    const productAmount = formData.product ? parseInt(formData.product) : 0;
    const months = formData.tenure ? parseInt(formData.tenure) : 1;

    const newProduct = {
      productName: formData.productName.trim(),
      product: productAmount,
      tenure: months,
      membershipid: membershipId,
      status: 'DRAFT',
      monthlyDetails: modalMonthlyDetails || []
    };

    console.log('Sending product data:', newProduct);

    try {
      if (isCreateModalOpen) {
        console.log('Sending request to create product...');
        const startTime = Date.now();

        const response = await addProduct(newProduct);
        const responseTime = Date.now() - startTime;

        console.log(`API response received in ${responseTime}ms:`, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        const responseData = await response.json();
        console.log('Response data:', responseData);

        if (response.ok) {
          toast.success(responseData.message || 'Product saved as draft successfully!');
          setHasUnsavedChanges(false);
          // Refresh products list to show the new product
          loadProducts();
          // Update selected product if it's the one being edited
          if (responseData.results && selectedProduct && selectedProduct.id === responseData.results.id) {
            setSelectedProduct(responseData.results);
          }
          // Remove the setTimeout delay for better UX
          handleCloseModal();
        } else {
          console.error('Product creation failed:', responseData);
          toast.error(responseData.message || responseData.error || 'Failed to create product');
        }
      } else if (isEditModalOpen) {
        const updateData = {
          ...newProduct,
          membershipid: membershipId
        };

        console.log('Sending request to update product...');
        const startTime = Date.now();

        const response = await updateProduct(editingProduct.id, updateData);
        const responseTime = Date.now() - startTime;

        console.log(`API response received in ${responseTime}ms:`, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        const responseData = await response.json();
        console.log('Response data:', responseData);

        if (response.ok) {
          toast.success(responseData.message || 'Product updated successfully!');
          setHasUnsavedChanges(false);
          // Refresh products list to show the updated product
          loadProducts();
          // Update selected product immediately to reflect changes
          if (responseData.results && selectedProduct && selectedProduct.id === responseData.results.id) {
            setSelectedProduct(responseData.results);
          }
          // Remove the setTimeout delay for better UX
          handleCloseModal();
        } else {
          console.error('Product update failed:', responseData);
          toast.error(responseData.message || responseData.error || 'Failed to update product');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred: ' + error.message);
    }
  };

  // Show delete confirmation dialog
  const handleDeleteProduct = (product) => {
    if (!canDeleteProduct) {
      toast.error('Delete Product permission is required');
      return;
    }
    setProductToDelete(product);
    setShowDeleteConfirm(true);
  };

  // Confirm delete product
  const confirmDeleteProduct = () => {
    if (!canDeleteProduct) {
      toast.error('Delete Product permission is required');
      return;
    }
    if (productToDelete) {
      deleteProduct(productToDelete.id).then(() => {
        if (selectedProduct && selectedProduct.id === productToDelete.id) {
          setSelectedProduct(null);
        }
        toast.success('Product deleted successfully');
        setShowDeleteConfirm(false);
        setProductToDelete(null);
      }).catch(error => {
        console.error('Error deleting product:', error);
        toast.error(error.message || 'Error deleting product');
      });
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setProductToDelete(null);
  };

  // Handle inline editing of individual fields
  const handleInlineEdit = (productId, rowIndex, field, value) => {
    const updatedMonthlyDetails = selectedProduct.monthlyDetails.map((detail, index) =>
      index === rowIndex ? { ...detail, [field]: value } : detail
    );

    const updatedProduct = {
      ...selectedProduct,
      monthlyDetails: updatedMonthlyDetails
    };

    // Update the product via API
    updateProduct(productId, { monthlyDetails: updatedMonthlyDetails })
      .then(() => {
        // Update local state
        setSelectedProduct(updatedProduct);
        toast.success(`${field} updated successfully`);
        setEditingRow(null); // Close editing mode
      })
      .catch(error => {
        console.error('Error updating field:', error);
        toast.error('Error updating field');
      });
  };

  // Handle row click to open edit modal
  const handleRowClick = (rowIndex) => {
    const rowData = selectedProduct.monthlyDetails[rowIndex];
    setEditingRowData({ ...rowData });
    setEditingRowIndexModal(rowIndex);
    setShowRowEditModal(true);
  };

  // Handle row edit modal save
  const handleRowEditSave = () => {
    if (editingRowData && editingRowIndexModal !== null) {
      const updatedMonthlyDetails = selectedProduct.monthlyDetails.map((detail, index) =>
        index === editingRowIndexModal ? editingRowData : detail
      );

      const updatedProduct = {
        ...selectedProduct,
        monthlyDetails: updatedMonthlyDetails
      };

      // Update the product via API
      updateProduct(selectedProduct.id, { monthlyDetails: updatedMonthlyDetails })
        .then(() => {
          // Update local state
          setSelectedProduct(updatedProduct);
          toast.success('Tenure period updated successfully');
          setShowRowEditModal(false);
          setEditingRowData(null);
          setEditingRowIndexModal(null);
        })
        .catch(error => {
          console.error('Error updating tenure period:', error);
          toast.error('Error updating tenure period');
        });
    }
  };

  // Handle row edit modal cancel
  const handleRowEditCancel = () => {
    setShowRowEditModal(false);
    setEditingRowData(null);
    setEditingRowIndexModal(null);
  };

  // Handle row edit data change
  const handleRowEditDataChange = (field, value) => {
    setEditingRowData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Edit Specific Row
  const handleEditRow = (product, rowIndex) => {
    if (!canEditProduct) {
      toast.error('Edit Product permission is required');
      return;
    }
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Do you want to continue? Your changes will be lost.')) {
        return;
      }
    }

    setEditingProduct(product);
    setEditingRowIndex(rowIndex);
    setFormData({
      productName: product.productName || '',
      product: (product.product || 0).toString(),
      tenure: (product.tenure || 0).toString(),
      status: product.status || 'DRAFT'
    });
    setMonthlyDetails([...(product.monthlyDetails || [])]);
    setModalMonthlyDetails([...(product.monthlyDetails || [])]); // Set modal state with current values
    console.log('Edit modal opened with monthly details:', product.monthlyDetails);
    console.log('Modal monthly details set to:', [...(product.monthlyDetails || [])]);
    setIsDraftMode(product.status === 'DRAFT');
    setIsEditModalOpen(true);
    setHasUnsavedChanges(false);
  };

  // Select Product to View Details
  const handleProductSelect = (product) => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Do you want to continue? Your changes will be lost.')) {
        return;
      }
    }
    setSelectedProduct(product);
    setIsProductMasterCollapsed(false);
    setHasUnsavedChanges(false);
  };

  // Handle monthly detail changes (for main product display)
  const handleMonthlyDetailChange = (monthIndex, field, value) => {
    const updatedDetails = monthlyDetails.map((detail, index) =>
      index === monthIndex ? { ...detail, [field]: value } : detail
    );
    setMonthlyDetails(updatedDetails);
    setHasUnsavedChanges(true);
  };

  // Handle modal monthly detail changes (doesn't immediately reflect in main UI)
  const handleModalMonthlyDetailChange = (monthIndex, field, value) => {
    const updatedDetails = modalMonthlyDetails.map((detail, index) =>
      index === monthIndex ? { ...detail, [field]: value } : detail
    );
    setModalMonthlyDetails(updatedDetails);
    setHasUnsavedChanges(true);
  };

  // Handle tenure sorting
  const handleTenureSort = () => {
    setTenureSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Handle modal tenure sorting
  const handleModalTenureSort = () => {
    setModalTenureSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Get sorted monthly details
  const getSortedMonthlyDetails = (details) => {
    if (!details || details.length === 0) return [];
    return [...details].sort((a, b) => {
      const sequenceA = parseInt(a.sequence) || 0;
      const sequenceB = parseInt(b.sequence) || 0;
      if (tenureSortOrder === 'asc') {
        return sequenceA - sequenceB;
      } else {
        return sequenceB - sequenceA;
      }
    });
  };

  // Get sorted modal monthly details
  const getSortedModalMonthlyDetails = (details) => {
    if (!details || details.length === 0) return [];
    return [...details].sort((a, b) => {
      const sequenceA = parseInt(a.sequence) || 0;
      const sequenceB = parseInt(b.sequence) || 0;
      if (modalTenureSortOrder === 'asc') {
        return sequenceA - sequenceB;
      } else {
        return sequenceB - sequenceA;
      }
    });
  };

  // Handle form data changes
  const handleFormDataChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);

    // Auto-generate tenure details when tenure changes (only for create mode)
    if (field === 'tenure' && isCreateModalOpen) {
      const months = parseInt(value) || 0;

      if (months > 0) {
        const newMonthlyDetails = Array.from({ length: months }, (_, index) => ({
          sequence: index + 1,
          bid: '',
          prize: '',
          comm: '',
          bal: '',
          profit: '',
          due: ''
        }));
        setMonthlyDetails(newMonthlyDetails);
        setModalMonthlyDetails(newMonthlyDetails);
      } else {
        setMonthlyDetails([]);
        setModalMonthlyDetails([]);
      }
    }

    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Close modal with unsaved changes check
  const handleCloseModal = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Do you want to continue? Your changes will be lost.')) {
        return;
      }
    }

    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setEditingProduct(null);
    setFormData({ productName: '', product: '', tenure: '', status: 'ACTIVE' });
    setMonthlyDetails([]);
    setModalMonthlyDetails([]); // Reset modal state
    setModalTenureSortOrder('asc'); // Reset modal sort order
    setFormErrors({});
    setHasUnsavedChanges(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 md:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  Products Management
                </h1>
                <p className="text-sm text-gray-600">
                  {products.length > 0 ? `${products.length} products configured` : 'No products created yet'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                  <span className="text-sm font-medium text-red-800">
                    {products.filter(p => p.status === 'ACTIVE').length} Active
                  </span>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
                  <span className="text-sm font-medium text-yellow-800">
                    {products.filter(p => p.status === 'DRAFT').length} Draft
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Panel - Product List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Product List</h2>
                  <p className="text-xs text-gray-500 mt-1">Select a product to view details</p>
                </div>
                {canAddProduct && (
                  <button
                    onClick={handleCreateProduct}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg"
                    title="+ Add Products"
                  >
                    <FaPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">+ Add Products</span>
                  </button>
                )}
              </div>

              {/* Product List */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-2"></div>
                    <p className="text-sm font-medium">Loading products...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-red-500">
                    <div className="bg-red-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                      <FaExclamationTriangle className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium">Error: {error}</p>
                    <button
                      onClick={() => {
                        console.log('Retrying product load...');
                        window.location.reload();
                      }}
                      className="mt-2 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="bg-gray-200 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                      <FaPlus className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium">No products created yet</p>
                    <p className="text-xs text-gray-400 mt-1">Create your first product to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {products.filter(product => product && product.productName && product.id).map((product) => (
                      <div
                        key={`product-${product.id}`}
                        onClick={() => handleProductSelect(product)}
                        className={`group relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${selectedProduct && selectedProduct.id === product.id
                          ? 'border-red-500 bg-gradient-to-br from-red-50 to-red-100 shadow-xl'
                          : 'border-gray-200 bg-white hover:border-red-300 hover:shadow-md'
                          }`}
                      >
                        {/* Product Name and Status */}
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-sm font-bold text-gray-900 truncate flex-1">
                            {product.productName || 'Unnamed Product'}
                          </h3>
                          {product.status === 'DRAFT' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300 whitespace-nowrap shadow-sm">
                              📝 DRAFT
                            </span>
                          )}
                          {product.status === 'ACTIVE' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300 whitespace-nowrap shadow-sm">
                              ✅ ACTIVE
                            </span>
                          )}
                        </div>

                        {/* Amount and Tenure */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="bg-gray-100 rounded-lg px-3 py-1">
                            <span className="font-bold text-gray-900">₹{(product.product || 0).toLocaleString()}</span>
                          </div>
                          <div className="bg-red-100 rounded-lg px-3 py-1">
                            <span className="font-bold text-red-800">{product.tenure || 0} months</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-2 flex gap-1">
                          {product.status === 'DRAFT' && isDraftProductComplete(product) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActivateProduct(product);
                              }}
                              className="flex-1 px-3 py-2 text-xs bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-bold shadow-md hover:shadow-lg"
                              title="Convert to Active"
                            >
                              🚀 Activate
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Product Details */}
          <div className="lg:col-span-2">
            {selectedProduct ? (
              <div className="space-y-6">
                {/* Product Master Section */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                  <div
                    className="flex items-center justify-between p-4 md:p-6 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => setIsProductMasterCollapsed(!isProductMasterCollapsed)}
                  >
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-gray-900">
                        {selectedProduct.productName || 'Unnamed Product'}
                      </h2>
                      {selectedProduct.status === 'DRAFT' && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                          📝 DRAFT
                        </span>
                      )}
                      {selectedProduct.status === 'ACTIVE' && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          ✅ ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {selectedProduct.status === 'DRAFT' ? (
                        <>
                          {isDraftProductComplete(selectedProduct) ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActivateProduct(selectedProduct);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg"
                              title="Make it Active"
                            >
                              <FaSave className="w-4 h-4" />
                              <span className="hidden sm:inline">Make it Active</span>
                            </button>
                          ) : null}
                          {canEditProduct && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditRow(selectedProduct, 0);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-md hover:shadow-lg"
                              title="Edit Product"
                            >
                              <FaEdit className="w-4 h-4" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          {canEditProduct && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMakeDraft(selectedProduct);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white text-sm rounded-lg hover:from-yellow-700 hover:to-yellow-800 transition-all duration-200 shadow-md hover:shadow-lg"
                              title="Make it Draft"
                            >
                              <FaEdit className="w-4 h-4" />
                              <span className="hidden sm:inline">Make it Draft</span>
                            </button>
                          )}
                          {canEditProduct && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditRow(selectedProduct, 0);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
                              title="Edit Product"
                            >
                              <FaEdit className="w-4 h-4" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                          )}
                        </>
                      )}
                      {canDeleteProduct && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProduct(selectedProduct);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg"
                          title="Delete Product"
                        >
                          <FaTrash className="w-4 h-4" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      )}
                      {isProductMasterCollapsed ? (
                        <FaChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <FaChevronUp className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {!isProductMasterCollapsed && (
                    <div className="px-3 md:px-4 pb-3 md:pb-4">
                      {/* Status Information */}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Product Amount
                          </label>
                          <p className="text-sm font-bold text-gray-900">
                            ₹{(selectedProduct.product || 0).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Tenure
                          </label>
                          <p className="text-sm font-bold text-gray-900">
                            {selectedProduct.tenure || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Details Section */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  {/* Header with gradient background */}
                  <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white">Tenure Details</h3>
                        <p className="text-sm text-red-100 mt-1">
                          {(selectedProduct.monthlyDetails || []).length} tenure periods configured
                        </p>
                      </div>
                      <button
                        onClick={handleTenureSort}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md border border-white border-opacity-30"
                        title={`Sort ${tenureSortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                      >
                        <span className="font-medium">Sort</span>
                        {tenureSortOrder === 'asc' ? (
                          <FaChevronDown className="w-3 h-3" />
                        ) : (
                          <FaChevronUp className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    {(selectedProduct.monthlyDetails || []).length > 0 ? (
                      <div className="space-y-3 overflow-x-auto">
                        {/* Header Row */}
                        <div className="grid grid-cols-8 gap-2 md:gap-3 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl font-bold text-sm text-red-800 shadow-sm border border-red-200">
                          <div className="text-center flex items-center justify-center gap-1 cursor-pointer bg-red-600 text-white hover:bg-red-700 rounded px-2 py-1" onClick={handleTenureSort}>
                            Tenure
                            {tenureSortOrder === 'asc' ? (
                              <FaChevronUp className="w-3 h-3" />
                            ) : (
                              <FaChevronDown className="w-3 h-3" />
                            )}
                          </div>
                          <div className="text-center">Bid</div>
                          <div className="text-center">Prize</div>
                          <div className="text-center">Comm</div>
                          <div className="text-center">Bal</div>
                          <div className="text-center">Profit</div>
                          <div className="text-center">Due</div>
                          <div className="text-center">Action</div>
                        </div>

                        {/* Data Rows */}
                        {getSortedMonthlyDetails(selectedProduct.monthlyDetails || []).map((detail, sortedIndex) => {
                          // Find the original index in the unsorted array
                          const originalIndex = (selectedProduct.monthlyDetails || []).findIndex(d => d.sequence === detail.sequence);
                          return (
                            <div
                              key={detail.sequence}
                              className="grid grid-cols-8 gap-2 md:gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:bg-red-50 hover:border-red-200 hover:shadow-md transition-all duration-200"
                            >
                              {/* Tenure Period */}
                              <div className="flex items-center justify-center">
                                <span className="text-xs font-bold text-white bg-red-600 px-2 py-1 rounded-full">
                                  {detail.sequence}
                                </span>
                              </div>

                              {/* Bid */}
                              <div className="flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-900 bg-red-50 px-3 py-2 rounded-lg border border-red-200 min-w-[70px] text-center shadow-sm">
                                  {detail.bid || '-'}
                                </span>
                              </div>

                              {/* Prize */}
                              <div className="flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-900 bg-red-50 px-3 py-2 rounded-lg border border-red-200 min-w-[70px] text-center shadow-sm">
                                  {detail.prize || '-'}
                                </span>
                              </div>

                              {/* Comm */}
                              <div className="flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-900 bg-red-50 px-3 py-2 rounded-lg border border-red-200 min-w-[70px] text-center shadow-sm">
                                  {detail.comm || '-'}
                                </span>
                              </div>

                              {/* Bal */}
                              <div className="flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-900 bg-red-50 px-3 py-2 rounded-lg border border-red-200 min-w-[70px] text-center shadow-sm">
                                  {detail.bal || '-'}
                                </span>
                              </div>

                              {/* Profit */}
                              <div className="flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-900 bg-red-50 px-3 py-2 rounded-lg border border-red-200 min-w-[70px] text-center shadow-sm">
                                  {detail.profit || '-'}
                                </span>
                              </div>

                              {/* Due */}
                              <div className="flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-900 bg-red-50 px-3 py-2 rounded-lg border border-red-200 min-w-[70px] text-center shadow-sm">
                                  {detail.due || '-'}
                                </span>
                              </div>

                              {/* Action */}
                              <div className="flex items-center justify-center">
                                <button
                                  onClick={() => handleRowClick(originalIndex)}
                                  className="flex items-center gap-1 px-4 py-2 text-sm bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg"
                                  title="Edit this tenure period"
                                >
                                  <FaEdit className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <div className="bg-red-50 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                          <FaEdit className="w-8 h-8 text-red-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">No tenure details configured</p>
                        <p className="text-xs text-gray-500 mt-1">Edit the product to add tenure periods</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <FaPlus className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">No Product Selected</h3>
                <p className="text-sm text-gray-600 mb-6">Select a product from the list to view its details and manage tenure periods</p>
                {canAddProduct && (
                  <button
                    onClick={handleCreateProduct}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white text-lg font-bold rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    <FaPlus className="w-6 h-6" />
                    + Add Products
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Product Modal */}
        {(isCreateModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto shadow-2xl">
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {isCreateModalOpen
                        ? (isDraftMode ? 'Create New Draft Product' : 'Create New Product')
                        : 'Edit Product'
                      }
                    </h2>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors duration-200"
                  >
                    <FaTimes className="w-6 h-6" />
                  </button>
                </div>

                {hasUnsavedChanges && (
                  <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                    <FaExclamationTriangle className="w-4 h-4 text-yellow-600" />
                    <p className="text-xs text-yellow-800">
                      You have unsaved changes. Save your work to avoid losing data.
                    </p>
                  </div>
                )}


                <div className="space-y-3">
                  {/* Basic Product Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Name *
                      </label>
                      {isEditModalOpen ? (
                        <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                          {formData.productName}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={formData.productName}
                          onChange={(e) => handleFormDataChange('productName', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${formErrors.productName ? 'border-red-500' : 'border-gray-300'
                            }`}
                          placeholder="Enter unique product name"
                        />
                      )}
                      {formErrors.productName && (
                        <p className="text-xs text-red-600 mt-1">{formErrors.productName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Amount {!isDraftMode && '*'}
                      </label>
                      {isEditModalOpen ? (
                        <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                          ₹{(formData.product || 0).toLocaleString()}
                        </div>
                      ) : (
                        <input
                          type="number"
                          value={formData.product}
                          onChange={(e) => handleFormDataChange('product', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          placeholder={isDraftMode ? "Optional for draft" : "Enter amount"}
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tenure (Months) {!isDraftMode && '*'}
                      </label>
                      {isEditModalOpen ? (
                        <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                          {formData.tenure} months
                        </div>
                      ) : (
                        <input
                          type="number"
                          value={formData.tenure}
                          onChange={(e) => handleFormDataChange('tenure', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          placeholder={isDraftMode ? "Optional for draft" : "Enter months"}
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      {isEditModalOpen ? (
                        <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${formData.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {formData.status === 'ACTIVE' ? '✅ ACTIVE' : '📝 DRAFT'}
                          </span>
                        </div>
                      ) : (
                        <select
                          value={formData.status}
                          onChange={(e) => handleFormDataChange('status', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="DRAFT">Draft</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Tenure Details Section */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Tenure Details</h3>
                        <p className="text-xs text-gray-600 mt-1">
                          {modalMonthlyDetails.length} tenure periods configured
                        </p>
                      </div>
                      <button
                        onClick={handleModalTenureSort}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                        title={`Sort ${modalTenureSortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                      >
                        <span className="font-medium">Sort</span>
                        {modalTenureSortOrder === 'asc' ? (
                          <FaChevronDown className="w-3 h-3" />
                        ) : (
                          <FaChevronUp className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    {modalMonthlyDetails.length > 0 ? (
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {getSortedModalMonthlyDetails(modalMonthlyDetails).map((detail, sortedIndex) => {
                          // Find the original index in the unsorted array
                          const originalIndex = modalMonthlyDetails.findIndex(d => d.sequence === detail.sequence);
                          console.log('Rendering modal detail:', detail, 'at sorted index:', sortedIndex, 'original index:', originalIndex);
                          return (
                            <div key={detail.sequence} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-bold text-gray-900">Tenure Period {detail.sequence}</h4>
                                <span className="text-xs font-bold text-white bg-red-600 px-2 py-1 rounded-full">
                                  {detail.sequence}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Bid</label>
                                  <input
                                    type="number"
                                    value={detail.bid}
                                    onChange={(e) => handleModalMonthlyDetailChange(originalIndex, 'bid', e.target.value)}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                    placeholder="Bid"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Prize</label>
                                  <input
                                    type="number"
                                    value={detail.prize}
                                    onChange={(e) => handleModalMonthlyDetailChange(originalIndex, 'prize', e.target.value)}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                    placeholder="Prize"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Comm</label>
                                  <input
                                    type="number"
                                    value={detail.comm}
                                    onChange={(e) => handleModalMonthlyDetailChange(originalIndex, 'comm', e.target.value)}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                    placeholder="Comm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Bal</label>
                                  <input
                                    type="number"
                                    value={detail.bal}
                                    onChange={(e) => handleModalMonthlyDetailChange(originalIndex, 'bal', e.target.value)}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                    placeholder="Bal"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Profit</label>
                                  <input
                                    type="number"
                                    value={detail.profit}
                                    onChange={(e) => handleModalMonthlyDetailChange(originalIndex, 'profit', e.target.value)}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                    placeholder="Profit"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Due</label>
                                  <input
                                    type="number"
                                    value={detail.due}
                                    onChange={(e) => handleModalMonthlyDetailChange(originalIndex, 'due', e.target.value)}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                    placeholder="Due"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <p className="text-sm">No monthly details available</p>
                        <p className="text-xs text-gray-400 mt-1">Monthly details will be generated based on tenure</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleCloseModal}
                    className="px-8 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 text-base font-medium shadow-sm hover:shadow-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProduct}
                    className="flex items-center gap-3 px-8 py-3 text-white rounded-xl transition-all duration-200 text-base font-bold bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 shadow-lg hover:shadow-xl"
                  >
                    <FaSave className="w-5 h-5" />
                    Save Draft
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Row Edit Modal */}
        {showRowEditModal && editingRowData && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 rounded-full p-2">
                    <FaEdit className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Edit Tenure Period</h3>
                    <p className="text-sm text-red-100">Period {editingRowData.sequence}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="space-y-4">
                  {/* Bid */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bid</label>
                    <input
                      type="number"
                      value={editingRowData.bid || ''}
                      onChange={(e) => handleRowEditDataChange('bid', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter bid amount"
                    />
                  </div>

                  {/* Prize */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prize</label>
                    <input
                      type="number"
                      value={editingRowData.prize || ''}
                      onChange={(e) => handleRowEditDataChange('prize', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter prize amount"
                    />
                  </div>

                  {/* Comm */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Commission</label>
                    <input
                      type="number"
                      value={editingRowData.comm || ''}
                      onChange={(e) => handleRowEditDataChange('comm', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter commission"
                    />
                  </div>

                  {/* Bal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Balance</label>
                    <input
                      type="number"
                      value={editingRowData.bal || ''}
                      onChange={(e) => handleRowEditDataChange('bal', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter balance"
                    />
                  </div>

                  {/* Profit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profit</label>
                    <input
                      type="number"
                      value={editingRowData.profit || ''}
                      onChange={(e) => handleRowEditDataChange('profit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter profit"
                    />
                  </div>

                  {/* Due */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Due</label>
                    <input
                      type="number"
                      value={editingRowData.due || ''}
                      onChange={(e) => handleRowEditDataChange('due', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter due amount"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleRowEditCancel}
                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRowEditSave}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 rounded-full p-2">
                    <FaTrash className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Delete Product</h3>
                    <p className="text-sm text-red-100">This action cannot be undone</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-gray-700 mb-2">
                    Are you sure you want to delete this product?
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-red-800">
                      <strong>Product:</strong> {productToDelete?.productName}
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      This will permanently remove the product and all its tenure details.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={cancelDelete}
                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteProduct}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                  >
                    Delete Product
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
