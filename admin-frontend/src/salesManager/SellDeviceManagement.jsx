import React, { useState, useEffect } from 'react';
import { 
  FaEye, 
  FaEdit, 
  FaCheck, 
  FaTimes, 
  FaFilter,
  FaSearch,
  FaDollarSign,
  FaChevronLeft,
  FaChevronRight,
  FaExpand
} from 'react-icons/fa';
import { useTheme, useRoleTheme } from '../context/ThemeContext';
import sellDeviceService from '../services/sellDeviceService';

const SellDeviceManagement = () => {
    const { isDarkMode } = useTheme();
    const { theme, getCardClasses, getIconClasses } = useRoleTheme();
    
    const [sellDevices, setSellDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showImageCarousel, setShowImageCarousel] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    // Fetch sell devices from API
    const fetchSellDevices = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const filters = {};
            if (filter !== 'all') {
                filters.status = filter;
            }
            if (searchTerm.trim()) {
                filters.search = searchTerm.trim();
            }

            const response = await sellDeviceService.getAllSellDevices(
                pagination.page,
                pagination.limit,
                filters
            );

            // Handle API response structure: { success, data: { sellDevices, pagination } }
            const devices = response.data?.sellDevices || response.sellDevices || response.data || [];
            setSellDevices(Array.isArray(devices) ? devices : []);
            setPagination(prev => ({
                ...prev,
                total: response.data?.pagination?.totalItems || response.total || 0,
                totalPages: response.data?.pagination?.totalPages || Math.ceil((response.total || 0) / prev.limit)
            }));
        } catch (error) {
            console.error('Error fetching sell devices:', error);
            setError(error.message || 'Failed to fetch sell device data');
        } finally {
            setLoading(false);
        }
    };

    // Load data on component mount and when dependencies change
    useEffect(() => {
        fetchSellDevices();
    }, [pagination.page, filter, searchTerm]);

    // Handle status update
    const handleStatusUpdate = async (deviceId, newStatus, quotedPrice = null) => {
        try {
            await sellDeviceService.updateSellDeviceStatus(deviceId, newStatus, quotedPrice);
            // Refresh the data
            fetchSellDevices();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status: ' + error.message);
        }
    };

    // Handle search
    const handleSearch = (term) => {
        setSearchTerm(term);
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    };

    // Handle filter change
    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    };

    // Handle pagination
    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    // Handle view device details
    const handleViewDevice = (device) => {
        setSelectedDevice(device);
        setShowModal(true);
    };

    // Helper function to get photo URL
    const getPhotoUrl = (photo) => {
        if (!photo) return '';
        // Photos are served via /api/sell-devices/files/:filename
        if (photo.filename) {
            return `${import.meta.env.VITE_APIURL || ''}/api/sell-devices/files/${photo.filename}`;
        }
        // Fallback to path or url
        if (photo.path) {
            return `${import.meta.env.VITE_APIURL || ''}${photo.path.startsWith('/') ? '' : '/'}${photo.path}`;
        }
        return photo.url || '';
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            reviewed: 'bg-blue-100 text-blue-800', 
            quoted: 'bg-purple-100 text-purple-800',
            completed: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    const getConditionBadge = (condition) => {
        const badges = {
            'Excellent': 'bg-green-100 text-green-800',
            'Good': 'bg-blue-100 text-blue-800',
            'Fair': 'bg-yellow-100 text-yellow-800',
            'Poor': 'bg-red-100 text-red-800'
        };
        return badges[condition] || 'bg-gray-100 text-gray-800';
    };

    const filteredDevices = (Array.isArray(sellDevices) ? sellDevices : []).filter(device => {
        const matchesFilter = filter === 'all' || device.status === filter;
        const customerName = device.sellerInfo?.fullName || device.customerName || device.customer || '';
        const deviceBrand = device.brand || device.deviceBrand || '';
        const deviceModel = device.model || '';
        const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             deviceModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             deviceBrand.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (loading) {
        return (
            <div className={`p-6 ${theme.background}`}>
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    return (
        <div className={`p-6 ${theme.background} min-h-screen`}>
            <div className="mb-8">
                <h1 className={`text-3xl font-bold ${theme.primary} mb-2`}>
                    Sell Device Management
                </h1>
                <p className={`${theme.secondary}`}>
                    Review and manage customer device sale requests
                </p>
            </div>

            {/* Filters and Search */}
            <div className={`mb-6 p-4 rounded-lg ${getCardClasses()}`}>
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <FaFilter className={theme.primary} />
                        <select 
                            value={filter} 
                            onChange={(e) => handleFilterChange(e.target.value)}
                            className="border rounded px-3 py-1"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="quoted">Quoted</option>
                            <option value="completed">Completed</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 flex-1 max-w-md">
                        <FaSearch className={theme.primary} />
                        <input
                            type="text"
                            placeholder="Search by customer, model, or brand..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="border rounded px-3 py-1 w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Devices Table */}
            <div className={`rounded-lg shadow-lg ${getCardClasses()}`}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className={`${theme.accent} text-white`}>
                            <tr>
                                <th className="px-6 py-3 text-left">Device</th>
                                <th className="px-6 py-3 text-left">Customer</th>
                                <th className="px-6 py-3 text-left">Phone</th>
                                <th className="px-6 py-3 text-left">Expected Price</th>
                                <th className="px-6 py-3 text-left">Quoted Price</th>
                                <th className="px-6 py-3 text-left">Status</th>
                                <th className="px-6 py-3 text-left">Condition</th>
                                <th className="px-6 py-3 text-left">Submitted</th>
                                <th className="px-6 py-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-8 text-center">
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                            <span className="ml-2">Loading sell device requests...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-8 text-center">
                                        <div className="text-red-600">
                                            <p className="mb-2">Error loading data: {error}</p>
                                            <button 
                                                onClick={fetchSellDevices}
                                                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                                            >
                                                Retry
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (Array.isArray(sellDevices) ? sellDevices : []).length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                                        No sell device requests found
                                    </td>
                                </tr>
                            ) : (
                                (Array.isArray(sellDevices) ? sellDevices : []).map((device, index) => (
                                    <tr key={device._id || device.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-semibold">{device.brand || device.deviceBrand}</div>
                                                <div className="text-sm text-gray-600">{device.model}</div>
                                                {device.storage && <div className="text-xs text-gray-500">{device.storage}</div>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-semibold">{device.sellerInfo?.fullName || device.customerName || device.customer || 'N/A'}</div>
                                                <div className="text-sm text-gray-600">{device.sellerInfo?.email || device.email || ''}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-blue-600">
                                                {device.sellerInfo?.phone || device.phone || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-green-600">
                                                ₹{(device.sellerInfo?.expectedPrice || device.expectedPrice)?.toLocaleString('en-IN') || '0'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {device.quotedPrice ? (
                                                <span className="font-semibold text-blue-600">
                                                    ₹{device.quotedPrice?.toLocaleString('en-IN')}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">Not set</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(device.status)}`}>
                                                {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${getConditionBadge(device.condition)}`}>
                                                {device.condition}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(device.submittedAt || device.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleViewDevice(device)}
                                                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                                    title="View Details"
                                                >
                                                    <FaEye />
                                                </button>
                                                {device.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(device._id || device.id, 'quoted')}
                                                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                                                            title="Quote Price"
                                                        >
                                                            <FaCheck />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(device._id || device.id, 'rejected')}
                                                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                            title="Reject"
                                                        >
                                                            <FaTimes />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t">
                        <div className="text-sm text-gray-500">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            
                            {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
                                const pageNumber = pagination.page <= 3 
                                    ? index + 1
                                    : pagination.page > pagination.totalPages - 2
                                    ? pagination.totalPages - 4 + index
                                    : pagination.page - 2 + index;
                                    
                                if (pageNumber > 0 && pageNumber <= pagination.totalPages) {
                                    return (
                                        <button
                                            key={pageNumber}
                                            onClick={() => handlePageChange(pageNumber)}
                                            className={`px-3 py-1 border rounded ${
                                                pagination.page === pageNumber
                                                    ? 'bg-purple-600 text-white'
                                                    : 'hover:bg-gray-100'
                                            }`}
                                        >
                                            {pageNumber}
                                        </button>
                                    );
                                }
                                return null;
                            })}
                            
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page === pagination.totalPages}
                                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Device Detail Modal */}
            {showModal && selectedDevice && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className={`max-w-2xl w-full rounded-lg ${getCardClasses()} max-h-screen overflow-y-auto`}>
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className={`text-2xl font-bold ${theme.primary}`}>
                                    Device Details
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <FaTimes size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className={`text-lg font-semibold ${theme.cardText} mb-4`}>
                                        Device Information
                                    </h3>
                                    <div className="space-y-2">
                                        <p><span className="font-semibold">Brand:</span> {selectedDevice.brand || selectedDevice.deviceBrand}</p>
                                        <p><span className="font-semibold">Model:</span> {selectedDevice.model}</p>
                                        <p><span className="font-semibold">Storage:</span> {selectedDevice.storage}</p>
                                        <p><span className="font-semibold">Color:</span> {selectedDevice.color}</p>
                                        <p><span className="font-semibold">Condition:</span> {selectedDevice.condition}</p>
                                        <p><span className="font-semibold">Expected Price:</span> ₹{(selectedDevice.sellerInfo?.expectedPrice || selectedDevice.expectedPrice)?.toLocaleString('en-IN')}</p>
                                        <p><span className="font-semibold">Photos:</span> {selectedDevice.photos?.length || 0} uploaded</p>
                                        {selectedDevice.issues && (
                                            <p><span className="font-semibold">Issues:</span> {selectedDevice.issues}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className={`text-lg font-semibold ${theme.cardText} mb-4`}>
                                        Customer Information
                                    </h3>
                                    <div className="space-y-2">
                                        <p><span className="font-semibold">Name:</span> {selectedDevice.sellerInfo?.fullName || selectedDevice.customerName || selectedDevice.customer}</p>
                                        <p><span className="font-semibold">Email:</span> {selectedDevice.sellerInfo?.email || selectedDevice.email}</p>
                                        <p><span className="font-semibold">Phone:</span> {selectedDevice.sellerInfo?.phone || selectedDevice.phone}</p>
                                        <p><span className="font-semibold">Address:</span> {selectedDevice.sellerInfo?.address || selectedDevice.address}</p>
                                        <p><span className="font-semibold">Submitted:</span> {new Date(selectedDevice.submittedAt || selectedDevice.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Device Photos */}
                            {selectedDevice.photos && selectedDevice.photos.length > 0 && (
                                <div className="mt-6">
                                    <h3 className={`text-lg font-semibold ${theme.cardText} mb-4`}>
                                        Device Photos ({selectedDevice.photos.length})
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {selectedDevice.photos.map((photo, index) => {
                                            const photoUrl = getPhotoUrl(photo);
                                            
                                            return (
                                                <div 
                                                    key={index} 
                                                    className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-purple-400 transition-colors cursor-pointer group"
                                                    onClick={() => {
                                                        setCurrentImageIndex(index);
                                                        setShowImageCarousel(true);
                                                    }}
                                                >
                                                    <img
                                                        src={photoUrl}
                                                        alt={photo.originalName || `Device photo ${index + 1}`}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect fill="%23f3f4f6" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="12">No Image</text></svg>';
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                                                        <FaExpand className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-xl" />
                                                    </div>
                                                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                                                        {photo.originalName || `Photo ${index + 1}`}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {selectedDevice.status === 'pending' && (
                                <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                                    <h3 className={`text-lg font-semibold ${theme.cardText} mb-4`}>
                                        Review Device
                                    </h3>
                                    <div className="flex flex-wrap gap-4 items-center">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Quoted Price (₹)</label>
                                            <input
                                                type="number"
                                                placeholder="Enter price"
                                                className="border rounded px-3 py-2 w-40"
                                                id="quotedPrice"
                                                min="0"
                                            />
                                        </div>
                                        <div className="flex gap-2 mt-5">
                                            <button
                                                onClick={() => {
                                                    const priceInput = document.getElementById('quotedPrice');
                                                    const price = priceInput?.value ? Number(priceInput.value) : null;
                                                    if (!price || price <= 0) {
                                                        alert('Please enter a valid quoted price');
                                                        return;
                                                    }
                                                    handleStatusUpdate(selectedDevice._id || selectedDevice.id, 'quoted', price);
                                                    setShowModal(false);
                                                }}
                                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                                            >
                                                <FaCheck /> Submit Quote
                                            </button>
                                            <button
                                                onClick={() => {
                                                    handleStatusUpdate(selectedDevice._id || selectedDevice.id, 'rejected');
                                                    setShowModal(false);
                                                }}
                                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                                            >
                                                <FaTimes /> Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Image Carousel Modal */}
            {showImageCarousel && selectedDevice?.photos && selectedDevice.photos.length > 0 && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60]"
                    onClick={() => setShowImageCarousel(false)}
                >
                    {/* Close Button */}
                    <button
                        onClick={() => setShowImageCarousel(false)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-2"
                    >
                        <FaTimes size={28} />
                    </button>

                    {/* Image Counter */}
                    <div className="absolute top-4 left-4 text-white text-lg font-medium bg-black bg-opacity-50 px-4 py-2 rounded-lg">
                        {currentImageIndex + 1} / {selectedDevice.photos.length}
                    </div>

                    {/* Previous Button */}
                    {selectedDevice.photos.length > 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setCurrentImageIndex((prev) => 
                                    prev === 0 ? selectedDevice.photos.length - 1 : prev - 1
                                );
                            }}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-40 text-white p-4 rounded-full transition-all z-10"
                        >
                            <FaChevronLeft size={24} />
                        </button>
                    )}

                    {/* Main Image */}
                    <div 
                        className="max-w-4xl max-h-[80vh] w-full mx-16 flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {(() => {
                            const currentPhoto = selectedDevice.photos[currentImageIndex];
                            const photoUrl = getPhotoUrl(currentPhoto);
                            
                            return (
                                <div className="relative">
                                    <img
                                        src={photoUrl}
                                        alt={currentPhoto.originalName || `Device photo ${currentImageIndex + 1}`}
                                        className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="%23374151" width="400" height="300"/><text x="200" y="150" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="18">Image not available</text></svg>';
                                        }}
                                    />
                                    {/* Image Name */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-center py-3 rounded-b-lg">
                                        {currentPhoto.originalName || `Photo ${currentImageIndex + 1}`}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Next Button */}
                    {selectedDevice.photos.length > 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setCurrentImageIndex((prev) => 
                                    prev === selectedDevice.photos.length - 1 ? 0 : prev + 1
                                );
                            }}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-40 text-white p-4 rounded-full transition-all z-10"
                        >
                            <FaChevronRight size={24} />
                        </button>
                    )}

                    {/* Thumbnail Strip */}
                    {selectedDevice.photos.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black bg-opacity-50 p-2 rounded-lg max-w-[90vw] overflow-x-auto">
                            {selectedDevice.photos.map((photo, index) => {
                                const thumbUrl = getPhotoUrl(photo);
                                
                                return (
                                    <button
                                        key={index}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentImageIndex(index);
                                        }}
                                        className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                                            index === currentImageIndex 
                                                ? 'border-purple-500 scale-110' 
                                                : 'border-transparent hover:border-white/50'
                                        }`}
                                    >
                                        <img
                                            src={thumbUrl}
                                            alt={`Thumbnail ${index + 1}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect fill="%23374151" width="64" height="64"/></svg>';
                                            }}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SellDeviceManagement;