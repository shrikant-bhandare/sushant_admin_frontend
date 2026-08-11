import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Star,
  Package,
  DollarSign,
  Image,
  Save,
  X,
  Upload,
  Tag,
  Smartphone,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Camera,
  FileText
} from 'lucide-react';
import { authenticatedFetch } from '../utils/authUtils';

const DeviceInventoryManagement = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [statusForm, setStatusForm] = useState({
    status: '',
    soldPrice: '',
    soldUserName: '',
    soldUserPhone: '',
    soldUserEmail: ''
  });
  const [statistics, setStatistics] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingImages, setExistingImages] = useState([]); // Track existing images from server
  const [imagesToRemove, setImagesToRemove] = useState([]); // Track images to be removed
  const [editingPriceId, setEditingPriceId] = useState(null); // Track which device price is being edited
  const [editPriceValue, setEditPriceValue] = useState('');
  const [editOriginalPriceValue, setEditOriginalPriceValue] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);
  const itemsPerPage = 12;

  const [deviceForm, setDeviceForm] = useState({
    brand: '',
    model: '',
    variant: '',
    storage: '',
    color: '',
    condition: '',
    category: '',
    price: '',
    originalPrice: '',
    description: '',
    specifications: {},
    features: [],
    warrantyMonths: '',
    accessories: [],
    featured: false,
    tags: [],
    images: []
  });

  // Categories and options
  const categories = ['sale', 'used', 'exchange'];
  const conditions = ['excellent', 'very-good', 'good', 'fair', 'damaged'];
  const brands = ['Apple', 'Samsung', 'OnePlus', 'Google', 'Xiaomi', 'Realme', 'Vivo', 'Oppo'];
  const storageOptions = ['64GB', '128GB', '256GB', '512GB', '1TB'];

  // Helper function to get full image URL
  const getImageUrl = (image) => {
    if (!image) return null;
    // If URL starts with http, it's already a full URL
    if (image.url && image.url.startsWith('http')) {
      return image.url;
    }
    // Otherwise, prepend the API base URL
    const baseUrl = import.meta.env.VITE_APIURL || '';
    return `${baseUrl}${image.url}`;
  };

  // Stable form update function - only updates form data, no error handling
  const updateFormField = useCallback((field, value) => {
    setDeviceForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // Clear errors for a specific field
  const clearFieldError = useCallback((field) => {
    setFormErrors(prev => {
      if (!prev[field]) return prev; // No error to clear
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Form validation - only returns errors, doesn't set them
  const getValidationErrors = () => {
    const errors = {};
    
    if (!deviceForm.brand) errors.brand = 'Brand is required';
    if (!deviceForm.model) errors.model = 'Model is required';
    if (!deviceForm.storage) errors.storage = 'Storage is required';
    if (!deviceForm.condition) errors.condition = 'Condition is required';
    if (!deviceForm.category) errors.category = 'Category is required';
    if (!deviceForm.price || deviceForm.price <= 0) errors.price = 'Valid price is required';
    
    return errors;
  };

  // Validate form and set errors only on submit
  const validateForm = () => {
    const errors = getValidationErrors();
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Fetch devices
  const fetchDevices = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString()
      });

      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (conditionFilter !== 'all') params.append('condition', conditionFilter);
      if (brandFilter !== 'all') params.append('brand', brandFilter);

      const response = await authenticatedFetch(`${import.meta.env.VITE_APIURL}/api/device-inventory?${params}`);
      const data = await response.json();

      if (data.success && data.data?.devices) {
        setDevices(data.data.devices);
        setTotalPages(data.data.pagination?.totalPages || 1);
        setCurrentPage(data.data.pagination?.currentPage || 1);
      } else {
        setDevices([]);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await authenticatedFetch(`${import.meta.env.VITE_APIURL}/api/device-inventory/statistics`);
      const data = await response.json();

      if (data.success) {
        setStatistics(data.data || {});
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchStatistics();
  }, [categoryFilter, statusFilter, conditionFilter, brandFilter]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      
      // Add device data
      Object.keys(deviceForm).forEach(key => {
        if (key === 'specifications' || key === 'features' || key === 'accessories' || key === 'tags') {
          formData.append(key, JSON.stringify(deviceForm[key]));
        } else if (key === 'images') {
          // Only add new images (File objects)
          deviceForm.images.forEach(image => {
            formData.append('images', image);
          });
        } else {
          formData.append(key, deviceForm[key]);
        }
      });

      // For edit mode, send existing images info
      if (selectedDevice) {
        // Send the list of existing images to keep
        formData.append('existingImages', JSON.stringify(existingImages));
        // Send the list of images to remove
        formData.append('imagesToRemove', JSON.stringify(imagesToRemove));
      }

      const url = selectedDevice 
        ? `${import.meta.env.VITE_APIURL}/api/device-inventory/${selectedDevice.id}`
        : `${import.meta.env.VITE_APIURL}/api/device-inventory`;
      
      const method = selectedDevice ? 'PUT' : 'POST';

      const response = await authenticatedFetch(url, {
        method,
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setShowAddModal(false);
        setShowEditModal(false);
        setSelectedDevice(null);
        resetForm();
        fetchDevices(currentPage);
        fetchStatistics();
        
        // Show success message
        alert(selectedDevice ? 'Device updated successfully!' : 'Device added successfully!');
      } else {
        alert('Error saving device: ' + data.message);
      }
    } catch (error) {
      console.error('Error saving device:', error);
      
      if (error.message.includes('Failed to fetch') || error.message.includes('Network error')) {
        alert('Unable to connect to server. Please make sure the backend server is running and try again.');
      } else if (error.message.includes('HTTP error! status: 404')) {
        alert('Service endpoint not found. Please contact support.');
      } else {
        alert('Error saving device: ' + (error.message || 'Unknown error occurred'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setDeviceForm({
      brand: '',
      model: '',
      variant: '',
      storage: '',
      color: '',
      condition: '',
      category: '',
      price: '',
      originalPrice: '',
      description: '',
      specifications: {},
      features: [],
      warrantyMonths: '',
      accessories: [],
      featured: false,
      tags: [],
      images: []
    });
    setFormErrors({});
    setIsSubmitting(false);
    setExistingImages([]);
    setImagesToRemove([]);
    setSelectedDevice(null); // Clear selected device for new additions
  };

  // Handle view device details
  const handleViewDetails = (device) => {
    setSelectedDevice({
      ...device,
      id: device._id || device.id  // Ensure we have a consistent id field
    });
    setStatusForm({
      status: device.status || 'active',
      soldPrice: device.soldPrice || '',
      soldUserName: device.soldUserName || '',
      soldUserPhone: device.soldUserPhone || '',
      soldUserEmail: device.soldUserEmail || ''
    });
    setShowDetailsModal(true);
  };

  // Handle edit device
  const handleEditDevice = (device) => {
    setSelectedDevice({
      ...device,
      id: device._id || device.id  // Ensure we have a consistent id field
    });
    setFormErrors({}); // Clear any existing errors
    // Load existing images from the device - extract URLs from image objects
    const imageUrls = (device.images || []).map(img => 
      typeof img === 'string' ? img : (img.url || img)
    );
    setExistingImages(imageUrls);
    setImagesToRemove([]);
    setDeviceForm({
      brand: device.brand || '',
      model: device.model || '',
      variant: device.variant || '',
      storage: device.storage || '',
      color: device.color || '',
      condition: device.condition || '',
      category: device.category || '',
      price: device.price?.toString() || '',
      originalPrice: device.originalPrice?.toString() || '',
      description: device.description || '',
      specifications: device.specifications || {},
      features: device.features || [],
      warrantyMonths: device.warrantyMonths?.toString() || '',
      accessories: device.accessories || [],
      featured: device.featured || false,
      tags: device.tags || [],
      images: [] // New images to upload
    });
    setShowEditModal(true);
  };

  // Delete device
  const deleteDevice = async (deviceId) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      try {
        const response = await authenticatedFetch(`${import.meta.env.VITE_APIURL}/api/device-inventory/${deviceId}`, {
          method: 'DELETE'
        });

        const data = await response.json();
        
        if (data.success) {
          fetchDevices(currentPage);
          fetchStatistics();
        }
      } catch (error) {
        console.error('Error deleting device:', error);
      }
    }
  };

  // Start editing price for a device
  const handleStartPriceEdit = (device, e) => {
    e.stopPropagation();
    setEditingPriceId(device._id || device.id);
    setEditPriceValue(device.price?.toString() || '');
    setEditOriginalPriceValue(device.originalPrice?.toString() || '');
  };

  // Cancel price editing
  const handleCancelPriceEdit = () => {
    setEditingPriceId(null);
    setEditPriceValue('');
    setEditOriginalPriceValue('');
  };

  // Save updated price
  const handleSavePrice = async (deviceId) => {
    if (!editPriceValue || Number(editPriceValue) <= 0) {
      alert('Please enter a valid price');
      return;
    }

    setSavingPrice(true);
    try {
      const response = await authenticatedFetch(`${import.meta.env.VITE_APIURL}/api/device-inventory/${deviceId}/price`, {
        method: 'PATCH',
        body: JSON.stringify({
          price: Number(editPriceValue),
          originalPrice: editOriginalPriceValue ? Number(editOriginalPriceValue) : null
        })
      });

      const data = await response.json();
      
      if (data.success) {
        fetchDevices(currentPage);
        handleCancelPriceEdit();
      } else {
        alert('Error updating price: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating price:', error);
      alert('Error updating price. Please try again.');
    } finally {
      setSavingPrice(false);
    }
  };

  // Update device status
  const updateDeviceStatus = async (id, statusData) => {
    try {
      const response = await authenticatedFetch(`${import.meta.env.VITE_APIURL}/api/device-inventory/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(statusData)
      });

      const data = await response.json();
      
      if (data.success) {
        fetchDevices(currentPage);
        fetchStatistics();
        // Update selected device if details modal is open
        if (selectedDevice && selectedDevice.id === id) {
          setSelectedDevice(prev => ({ ...prev, ...statusData }));
        }
        alert('Status updated successfully!');
      } else {
        alert('Error updating status: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating device status:', error);
      alert('Error updating status. Please try again.');
    }
  };

  // Handle status form submission
  const handleStatusSubmit = (e) => {
    e.preventDefault();
    
    // Validation for sold status
    if (statusForm.status === 'sold') {
      if (!statusForm.soldPrice || !statusForm.soldUserName || !statusForm.soldUserPhone) {
        alert('Please fill in all required fields for sold status.');
        return;
      }
    }
    
    updateDeviceStatus(selectedDevice.id, statusForm);
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setDeviceForm(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  // Filter devices based on search term
  const filteredDevices = devices.filter(device =>
    device.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      inactive: { color: 'bg-gray-100 text-gray-800', label: 'Inactive' },
      sold: { color: 'bg-blue-100 text-blue-800', label: 'Sold' }
    };

    const config = statusConfig[status] || statusConfig.active;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getCategoryBadge = (category) => {
    const categoryConfig = {
      sale: { color: 'bg-purple-100 text-purple-800', label: 'Sale' },
      used: { color: 'bg-orange-100 text-orange-800', label: 'Used' },
      exchange: { color: 'bg-teal-100 text-teal-800', label: 'Exchange' }
    };

    const config = categoryConfig[category] || categoryConfig.sale;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-lg shadow border">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-gray-900">{value}</h3>
          <p className="text-sm text-gray-600">{title}</p>
        </div>
      </div>
    </div>
  );

  // Render form modal content (inline to prevent re-creation)
  const renderFormModal = (show, onClose, isEdit = false) => {
    if (!show) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {isEdit ? 'Edit Device' : 'Add New Device'}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form 
              onSubmit={handleSubmit} 
              className="space-y-6"
            >
              {/* Basic Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand *
                  </label>
                  <select
                    value={deviceForm.brand}
                    onChange={(e) => setDeviceForm(prev => ({ ...prev, brand: e.target.value }))}
                    className={`w-full p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.brand ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Select Brand</option>
                    {brands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                  {formErrors.brand && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.brand}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model *
                  </label>
                  <input
                    type="text"
                    value={deviceForm.model}
                    onChange={(e) => setDeviceForm(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="e.g., iPhone 14 Pro"
                    className={`w-full p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.model ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {formErrors.model && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.model}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variant
                  </label>
                  <input
                    type="text"
                    value={deviceForm.variant}
                    onChange={(e) => setDeviceForm(prev => ({ ...prev, variant: e.target.value }))}
                    placeholder="e.g., Pro Max"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Storage *
                  </label>
                  <select
                    value={deviceForm.storage}
                    onChange={(e) => setDeviceForm(prev => ({ ...prev, storage: e.target.value }))}
                    className={`w-full p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.storage ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Select Storage</option>
                    {storageOptions.map(storage => (
                      <option key={storage} value={storage}>{storage}</option>
                    ))}
                  </select>
                  {formErrors.storage && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.storage}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <input
                    type="text"
                    value={deviceForm.color}
                    onChange={(e) => setDeviceForm(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="e.g., Space Black"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condition *
                  </label>
                  <select
                    value={deviceForm.condition}
                    onChange={(e) => setDeviceForm(prev => ({ ...prev, condition: e.target.value }))}
                    className={`w-full p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.condition ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Select Condition</option>
                    {conditions.map(condition => (
                      <option key={condition} value={condition}>
                        {condition.charAt(0).toUpperCase() + condition.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                  {formErrors.condition && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.condition}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={deviceForm.category}
                    onChange={(e) => setDeviceForm(prev => ({ ...prev, category: e.target.value }))}
                    className={`w-full p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                  {formErrors.category && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.category}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price *
                  </label>
                  <input
                    type="number"
                    value={deviceForm.price}
                    onChange={(e) => setDeviceForm(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="₹"
                    className={`w-full p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.price ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {formErrors.price && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.price}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Price
                  </label>
                  <input
                    type="number"
                    value={deviceForm.originalPrice}
                    onChange={(e) => setDeviceForm(prev => ({ ...prev, originalPrice: e.target.value }))}
                    placeholder="₹"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warranty (Months)
                  </label>
                  <input
                    type="number"
                    value={deviceForm.warrantyMonths}
                    onChange={(e) => setDeviceForm(prev => ({ ...prev, warrantyMonths: e.target.value }))}
                    placeholder="e.g., 12"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={deviceForm.description}
                  onChange={(e) => setDeviceForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of the device..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device Images
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Click to upload images</p>
                    <p className="text-gray-400 text-sm">PNG, JPG, WEBP up to 10MB each</p>
                  </label>
                </div>
                
                {/* Existing Images from Server (for edit mode) */}
                {existingImages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-600 mb-2">Existing Images:</p>
                    <div className="grid grid-cols-4 gap-4">
                      {existingImages.map((imageUrl, index) => {
                        const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${import.meta.env.VITE_APIURL}${imageUrl}`;
                        return (
                          <div key={`existing-${index}`} className="relative">
                            <img
                              src={fullImageUrl}
                              alt={`Existing ${index + 1}`}
                              className={`w-full h-20 object-cover rounded border ${imagesToRemove.includes(imageUrl) ? 'opacity-50 border-red-500' : ''}`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (imagesToRemove.includes(imageUrl)) {
                                  // Restore image
                                  setImagesToRemove(prev => prev.filter(img => img !== imageUrl));
                                } else {
                                  // Mark for removal
                                  setImagesToRemove(prev => [...prev, imageUrl]);
                                }
                              }}
                              className={`absolute -top-2 -right-2 ${imagesToRemove.includes(imageUrl) ? 'bg-green-600' : 'bg-red-600'} text-white rounded-full w-6 h-6 flex items-center justify-center`}
                              title={imagesToRemove.includes(imageUrl) ? 'Restore image' : 'Remove image'}
                            >
                              {imagesToRemove.includes(imageUrl) ? (
                                <RefreshCw className="w-4 h-4" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* New Images to Upload */}
                {deviceForm.images.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-600 mb-2">New Images to Upload:</p>
                    <div className="grid grid-cols-4 gap-4">
                      {deviceForm.images.map((image, index) => (
                        <div key={`new-${index}`} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newImages = deviceForm.images.filter((_, i) => i !== index);
                              setDeviceForm(prev => ({ ...prev, images: newImages }));
                            }}
                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Featured */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="featured"
                  checked={deviceForm.featured}
                  onChange={(e) => setDeviceForm(prev => ({ ...prev, featured: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="featured" className="ml-2 text-sm text-gray-700">
                  Feature this device on homepage
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isEdit ? 'Updating...' : 'Adding...'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{isEdit ? 'Update Device' : 'Add Device'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // Device Details Modal Component
  const DeviceDetailsModal = React.memo(({ show, onClose, device }) => {
    if (!show || !device) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                Device Details
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Device Images */}
              {device.images && device.images.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Images</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {device.images.slice(0, 4).map((image, index) => (
                      <img
                        key={index}
                        src={getImageUrl(image)}
                        alt={`${device.brand} ${device.model} ${index + 1}`}
                        className="w-full h-40 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Device Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Device Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Brand</label>
                    <p className="text-gray-900">{device.brand}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Model</label>
                    <p className="text-gray-900">{device.model}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Storage</label>
                    <p className="text-gray-900">{device.storage}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Color</label>
                    <p className="text-gray-900">{device.color || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Condition</label>
                    <p className="text-gray-900 capitalize">{device.condition?.replace('-', ' ')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <p className="text-gray-900 capitalize">{device.category}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price</label>
                    <p className="text-gray-900 font-semibold">₹{device.price?.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">{getStatusBadge(device.status)}</div>
                  </div>
                  {device.status === 'sold' && device.soldPrice && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sold Price</label>
                      <p className="text-gray-900 font-semibold">₹{device.soldPrice?.toLocaleString('en-IN')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sold User Details - Show only if device is sold */}
              {device.status === 'sold' && (device.soldUserName || device.soldUserPhone) && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Buyer Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {device.soldUserName && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <p className="text-gray-900">{device.soldUserName}</p>
                      </div>
                    )}
                    {device.soldUserPhone && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <p className="text-gray-900">{device.soldUserPhone}</p>
                      </div>
                    )}
                    {device.soldUserEmail && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="text-gray-900">{device.soldUserEmail}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {device.description && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Description</h3>
                  <p className="text-gray-700">{device.description}</p>
                </div>
              )}

              {/* Action Buttons */}
              <form onSubmit={handleStatusSubmit} className="pt-6 border-t">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Change Status</label>
                    <select
                      value={statusForm.status}
                      onChange={(e) => setStatusForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="sold">Sold</option>
                    </select>
                  </div>

                  {/* Sold Details - Show only when status is 'sold' */}
                  {statusForm.status === 'sold' && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900">Sold Details</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sold Price *
                        </label>
                        <input
                          type="number"
                          value={statusForm.soldPrice}
                          onChange={(e) => setStatusForm(prev => ({ ...prev, soldPrice: e.target.value }))}
                          placeholder="₹"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Buyer Name *
                        </label>
                        <input
                          type="text"
                          value={statusForm.soldUserName}
                          onChange={(e) => setStatusForm(prev => ({ ...prev, soldUserName: e.target.value }))}
                          placeholder="Enter buyer name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Buyer Phone *
                        </label>
                        <input
                          type="tel"
                          value={statusForm.soldUserPhone}
                          onChange={(e) => setStatusForm(prev => ({ ...prev, soldUserPhone: e.target.value }))}
                          placeholder="Enter phone number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Buyer Email
                        </label>
                        <input
                          type="email"
                          value={statusForm.soldUserEmail}
                          onChange={(e) => setStatusForm(prev => ({ ...prev, soldUserEmail: e.target.value }))}
                          placeholder="Enter email address (optional)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-center">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-blue-500 focus:ring-2 focus:ring-offset-2"
                    >
                      Update Status
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Device Inventory Management</h1>
        <p className="text-gray-600">Manage devices for sale, used devices, and exchanges</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Devices"
          value={statistics.totalDevices || 0}
          icon={Package}
          color="bg-blue-500"
        />
        <StatCard
          title="Active Listings"
          value={statistics.activeCount || 0}
          icon={ShoppingCart}
          color="bg-green-500"
        />
        <StatCard
          title="Sold Devices"
          value={statistics.soldCount || 0}
          icon={TrendingUp}
          color="bg-purple-500"
        />
        <StatCard
          title="Total Value"
          value={`₹${(statistics.totalValue || 0).toLocaleString('en-IN')}`}
          icon={DollarSign}
          color="bg-orange-500"
        />
      </div>

      {/* Filters and Add Button */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="sale">Sale</option>
            <option value="used">Used</option>
            <option value="exchange">Exchange</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="sold">Sold</option>
          </select>

          {/* Brand Filter */}
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Brands</option>
            {brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => fetchDevices(currentPage)}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>

          {/* Add Device Button */}
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Device
          </button>
        </div>
      </div>

      {/* Device Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Loading devices...</p>
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No devices found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
              {filteredDevices.map((device) => (
                <div key={device._id || device.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  {/* Device Image */}
                  <div className="aspect-square bg-gray-100 relative">
                    {device.images && device.images.length > 0 ? (
                      <img
                        src={getImageUrl(device.images[0])}
                        alt={`${device.brand} ${device.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Smartphone className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Featured Badge */}
                    {device.featured && (
                      <div className="absolute top-2 left-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </span>
                      </div>
                    )}
                    
                    {/* Category Badge */}
                    <div className="absolute top-2 right-2">
                      {getCategoryBadge(device.category)}
                    </div>
                  </div>

                  {/* Device Info */}
                  <div className="p-4">
                    <div className="mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {device.brand} {device.model}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {device.storage} • {device.color}
                      </p>
                    </div>

                    <div className="mb-3">
                      {/* Price Section - Editable */}
                      {editingPriceId === (device._id || device.id) ? (
                        <div className="space-y-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Sale Price *</label>
                            <input
                              type="number"
                              value={editPriceValue}
                              onChange={(e) => setEditPriceValue(e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                              placeholder="₹ Sale Price"
                              autoFocus
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Original Price</label>
                            <input
                              type="number"
                              value={editOriginalPriceValue}
                              onChange={(e) => setEditOriginalPriceValue(e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                              placeholder="₹ Original Price (for discount)"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSavePrice(device._id || device.id)}
                              disabled={savingPrice}
                              className="flex-1 flex items-center justify-center px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                            >
                              <Save className="w-3 h-3 mr-1" />
                              {savingPrice ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={handleCancelPriceEdit}
                              className="flex-1 flex items-center justify-center px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center justify-between mb-1 cursor-pointer hover:bg-gray-50 rounded p-1 -m-1 group"
                          onClick={(e) => handleStartPriceEdit(device, e)}
                          title="Click to edit price"
                        >
                          <div className="flex items-center">
                            <span className="text-lg font-bold text-green-600">
                              ₹{device.price?.toLocaleString('en-IN')}
                            </span>
                            <Edit className="w-3 h-3 ml-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          {device.originalPrice && device.originalPrice > device.price && (
                            <span className="text-sm text-gray-500 line-through">
                              ₹{device.originalPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        {getStatusBadge(device.status)}
                        <span className="text-xs text-gray-500 capitalize">
                          {device.condition?.replace('-', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleViewDetails(device)}
                        className="flex-1 flex items-center justify-center px-2 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Details
                      </button>
                      
                      <button
                        onClick={() => handleEditDevice(device)}
                        className="flex-1 flex items-center justify-center px-2 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      
                      <button
                        onClick={() => deleteDevice(device._id || device.id)}
                        className="flex items-center justify-center px-2 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => fetchDevices(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => fetchDevices(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {renderFormModal(showAddModal, () => setShowAddModal(false), false)}
      {renderFormModal(showEditModal, () => setShowEditModal(false), true)}
      
      <DeviceDetailsModal
        show={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        device={selectedDevice}
      />
    </div>
  );
};

export default DeviceInventoryManagement;