import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Image,
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { authenticatedFetch } from '../utils/authUtils';

const SellDeviceManagement = () => {
  const [sellDevices, setSellDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [statistics, setStatistics] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Fetch sell devices
  const fetchSellDevices = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString()
      });

      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (brandFilter !== 'all') params.append('brand', brandFilter);

      const response = await authenticatedFetch(`${import.meta.env.VITE_APIURL}/api/sell-devices?${params}`);
      const data = await response.json();

      if (data.success && data.data?.sellDevices) {
        setSellDevices(data.data.sellDevices);
        setTotalPages(data.data.pagination?.totalPages || 1);
        setCurrentPage(data.data.pagination?.currentPage || 1);
      } else {
        setSellDevices([]);
      }
    } catch (error) {
      console.error('Error fetching sell devices:', error);
      setSellDevices([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await authenticatedFetch(`${import.meta.env.VITE_APIURL}/api/sell-devices/statistics`);
      const data = await response.json();

      if (data.success) {
        setStatistics(data.data || {});
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  useEffect(() => {
    fetchSellDevices();
    fetchStatistics();
  }, [statusFilter, brandFilter]);

  // Update device status
  const updateDeviceStatus = async (id, status, adminNotes = '', quotedPrice = 0) => {
    try {
      const response = await authenticatedFetch(`${import.meta.env.VITE_APIURL}/api/sell-devices/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          adminNotes,
          quotedPrice,
          reviewedBy: 'Admin' // This should be the logged-in admin's name
        })
      });

      const data = await response.json();
      
      if (data.success) {
        fetchSellDevices(currentPage);
        fetchStatistics();
        if (selectedDevice && selectedDevice.id === id) {
          setSelectedDevice({ ...selectedDevice, status, adminNotes, quotedPrice });
        }
      }
    } catch (error) {
      console.error('Error updating device status:', error);
    }
  };

  // Delete device
  const deleteDevice = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        const response = await authenticatedFetch(`${import.meta.env.VITE_APIURL}/api/sell-devices/${id}`, {
          method: 'DELETE'
        });

        const data = await response.json();
        
        if (data.success) {
          fetchSellDevices(currentPage);
          fetchStatistics();
          if (showDetails && selectedDevice?.id === id) {
            setShowDetails(false);
            setSelectedDevice(null);
          }
        }
      } catch (error) {
        console.error('Error deleting device:', error);
      }
    }
  };

  // Filter devices based on search term
  const filteredDevices = (Array.isArray(sellDevices) ? sellDevices : []).filter(device =>
    device.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.sellerInfo?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.sellerInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      reviewed: { color: 'bg-blue-100 text-blue-800', icon: Eye },
      quoted: { color: 'bg-purple-100 text-purple-800', icon: DollarSign },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
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

  if (showDetails && selectedDevice) {
    return (
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => setShowDetails(false)}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back to List
          </button>
        </div>

        {/* Device Details */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedDevice.brand} {selectedDevice.model}
                </h1>
                <p className="text-gray-600 mt-1">
                  Submitted on {new Date(selectedDevice.createdAt).toLocaleDateString('en-GB')}
                </p>
              </div>
              <div className="text-right">
                {getStatusBadge(selectedDevice.status)}
                {selectedDevice.quotedPrice > 0 && (
                  <p className="text-lg font-semibold text-green-600 mt-2">
                    ₹{selectedDevice.quotedPrice?.toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Device Information */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Device Information</h2>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">Storage:</span>
                    <span className="ml-2 text-gray-600">{selectedDevice.storage}</span>
                  </div>
                  <div>
                    <span className="font-medium">Color:</span>
                    <span className="ml-2 text-gray-600">{selectedDevice.color}</span>
                  </div>
                  <div>
                    <span className="font-medium">Condition:</span>
                    <span className="ml-2 text-gray-600">{selectedDevice.condition}</span>
                  </div>
                  <div>
                    <span className="font-medium">Purchase Year:</span>
                    <span className="ml-2 text-gray-600">{selectedDevice.purchaseYear}</span>
                  </div>
                  <div>
                    <span className="font-medium">Warranty Status:</span>
                    <span className="ml-2 text-gray-600">{selectedDevice.warrantyStatus}</span>
                  </div>
                  <div>
                    <span className="font-medium">Accessories:</span>
                    <span className="ml-2 text-gray-600">
                      {selectedDevice.accessories?.join(', ') || 'None specified'}
                    </span>
                  </div>
                  {selectedDevice.issues && (
                    <div>
                      <span className="font-medium">Issues:</span>
                      <p className="text-gray-600 mt-1">{selectedDevice.issues}</p>
                    </div>
                  )}
                </div>

                {/* Photos */}
                {selectedDevice.photos && selectedDevice.photos.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Device Photos</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedDevice.photos.map((photo, index) => (
                        <img
                          key={index}
                          src={`${import.meta.env.VITE_APIURL}/api/sell-devices/files/${photo.filename}`}
                          alt={`Device photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Seller Information */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Seller Information</h2>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-400 mr-3" />
                    <span>{selectedDevice.sellerInfo?.fullName}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-400 mr-3" />
                    <span>{selectedDevice.sellerInfo?.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-400 mr-3" />
                    <span>{selectedDevice.sellerInfo?.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 text-gray-400 mr-3" />
                    <span>{selectedDevice.sellerInfo?.address}</span>
                  </div>
                  <div>
                    <span className="font-medium">Expected Price:</span>
                    <span className="ml-2 text-gray-600">
                      ₹{selectedDevice.sellerInfo?.expectedPrice?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Documents */}
                {selectedDevice.documents && selectedDevice.documents.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Documents</h3>
                    <div className="space-y-2">
                      {selectedDevice.documents.map((doc, index) => (
                        <a
                          key={index}
                          href={`${import.meta.env.VITE_APIURL}/api/sell-devices/files/${doc.filename}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center p-2 border rounded hover:bg-gray-50"
                        >
                          <FileText className="w-4 h-4 text-gray-400 mr-3" />
                          <span className="flex-1">{doc.originalName}</span>
                          <Download className="w-4 h-4 text-gray-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Actions */}
                <div className="mt-6 p-4 bg-gray-50 rounded">
                  <h3 className="font-semibold mb-3">Admin Actions</h3>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateDeviceStatus(selectedDevice.id, 'reviewed')}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        disabled={selectedDevice.status === 'reviewed'}
                      >
                        Mark Reviewed
                      </button>
                      <button
                        onClick={() => {
                          const price = prompt('Enter quoted price:');
                          if (price) {
                            updateDeviceStatus(selectedDevice.id, 'quoted', '', parseInt(price));
                          }
                        }}
                        className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                      >
                        Quote Price
                      </button>
                      <button
                        onClick={() => updateDeviceStatus(selectedDevice.id, 'completed')}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => updateDeviceStatus(selectedDevice.id, 'rejected')}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                    <textarea
                      placeholder="Add admin notes..."
                      className="w-full p-2 border rounded"
                      rows="3"
                      onChange={(e) => {
                        // You can implement real-time note saving here
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sell Device Management</h1>
        <p className="text-gray-600">Manage device sell requests from customers</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="Total Requests"
          value={statistics.totalDevices || 0}
          icon={Phone}
          color="bg-blue-500"
        />
        <StatCard
          title="Pending Review"
          value={statistics.pendingCount || 0}
          icon={Clock}
          color="bg-yellow-500"
        />
        <StatCard
          title="Quoted"
          value={statistics.quotedCount || 0}
          icon={DollarSign}
          color="bg-purple-500"
        />
        <StatCard
          title="Completed"
          value={statistics.completedCount || 0}
          icon={CheckCircle}
          color="bg-green-500"
        />
        <StatCard
          title="Rejected"
          value={statistics.rejectedCount || 0}
          icon={XCircle}
          color="bg-red-500"
        />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="quoted">Quoted</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Brand Filter */}
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Brands</option>
            <option value="Apple">Apple</option>
            <option value="Samsung">Samsung</option>
            <option value="OnePlus">OnePlus</option>
            <option value="Google">Google</option>
            <option value="Xiaomi">Xiaomi</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => fetchSellDevices(currentPage)}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expected Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  </td>
                </tr>
              ) : filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No devices found
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device) => (
                  <tr key={device.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {device.brand} {device.model}
                        </div>
                        <div className="text-sm text-gray-500">
                          {device.storage} • {device.color}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {device.sellerInfo?.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {device.sellerInfo?.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(device.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{device.sellerInfo?.expectedPrice?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(device.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedDevice(device);
                            setShowDetails(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteDevice(device.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => fetchSellDevices(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchSellDevices(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellDeviceManagement;