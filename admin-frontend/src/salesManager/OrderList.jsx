import React, { useState, useEffect } from 'react';
import { 
  FaEye, 
  FaSearch, 
  FaFilter,
  FaShoppingCart,
  FaCalendarAlt,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaChevronLeft,
  FaChevronRight,
  FaSync,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaDownload,
  FaPrint
} from 'react-icons/fa';
import { useTheme, useRoleTheme } from '../context/ThemeContext';
import { authenticatedFetch } from '../utils/authUtils';

const OrderList = () => {
  const { isDarkMode } = useTheme();
  const { theme } = useRoleTheme();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all'); // 'all', 'purchase-requests', 'completed-sales'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [statistics, setStatistics] = useState({
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    purchaseRequests: 0
  });

  // Helper function to get full image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    // If URL starts with http, it's already a full URL
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    // Otherwise, prepend the API base URL
    const baseUrl = import.meta.env.VITE_APIURL || '';
    return `${baseUrl}${imageUrl}`;
  };

  // Fetch orders from device inventory (sold devices)
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      let allOrders = [];

      // Fetch device purchase requests (from website form)
      if (orderTypeFilter === 'all' || orderTypeFilter === 'purchase-requests') {
        try {
          const purchaseParams = new URLSearchParams({
            page: pagination.page.toString(),
            limit: pagination.limit.toString()
          });
          
          if (filter !== 'all') {
            purchaseParams.append('status', filter);
          }

          const purchaseResponse = await authenticatedFetch(
            `${import.meta.env.VITE_APIURL}/api/device-orders?${purchaseParams}`
          );
          const purchaseData = await purchaseResponse.json();

          if (purchaseData.success && purchaseData.data?.orders) {
            const purchaseOrders = purchaseData.data.orders.map(order => ({
              id: order._id || order.id,
              orderNumber: `REQ-${(order._id || order.id).slice(-6).toUpperCase()}`,
              orderType: 'purchase-request',
              device: {
                brand: order.deviceInfo?.brand,
                model: order.deviceInfo?.model,
                storage: order.deviceInfo?.storage,
                color: order.deviceInfo?.color,
                condition: order.deviceInfo?.condition,
                category: order.deviceInfo?.category,
                image: null
              },
              customer: {
                name: order.customerInfo?.name || 'N/A',
                phone: order.customerInfo?.phone || 'N/A',
                email: order.customerInfo?.email || '',
                address: order.customerInfo?.address || '',
                message: order.customerInfo?.message || ''
              },
              originalPrice: order.deviceInfo?.price,
              soldPrice: order.deviceInfo?.price,
              soldDate: order.createdAt,
              status: order.status || 'pending',
              paymentStatus: order.status === 'paid' || order.status === 'delivered' ? 'paid' : 'pending',
              notes: order.notes,
              contactedAt: order.contactedAt,
              confirmedAt: order.confirmedAt,
              paidAt: order.paidAt,
              shippedAt: order.shippedAt,
              deliveredAt: order.deliveredAt
            }));
            allOrders = [...allOrders, ...purchaseOrders];
          }
        } catch (err) {
          console.error('Error fetching purchase requests:', err);
        }
      }

      // Fetch sold devices from inventory
      if (orderTypeFilter === 'all' || orderTypeFilter === 'completed-sales') {
        try {
          const params = new URLSearchParams({
            page: pagination.page.toString(),
            limit: pagination.limit.toString(),
            status: 'sold'
          });

          if (filter !== 'all' && orderTypeFilter === 'completed-sales') {
            params.append('category', filter);
          }

          const response = await authenticatedFetch(
            `${import.meta.env.VITE_APIURL}/api/device-inventory?${params}`
          );
          const data = await response.json();

          if (data.success && data.data?.devices) {
            const soldOrders = data.data.devices.map(device => ({
              id: device._id || device.id,
              orderNumber: `ORD-${(device._id || device.id).slice(-6).toUpperCase()}`,
              orderType: 'completed-sale',
              device: {
                brand: device.brand,
                model: device.model,
                storage: device.storage,
                color: device.color,
                condition: device.condition,
                category: device.category,
                image: getImageUrl(device.images?.[0]?.url)
              },
              customer: {
                name: device.soldUserName || 'N/A',
                phone: device.soldUserPhone || 'N/A',
                email: device.soldUserEmail || ''
              },
              originalPrice: device.price,
              soldPrice: device.soldPrice,
              soldDate: device.soldDate || device.updatedAt,
              status: 'completed',
              paymentStatus: 'paid'
            }));
            allOrders = [...allOrders, ...soldOrders];
          }
        } catch (err) {
          console.error('Error fetching sold devices:', err);
        }
      }

      // Sort by date (newest first)
      allOrders.sort((a, b) => new Date(b.soldDate) - new Date(a.soldDate));
      
      setOrders(allOrders);
      setPagination(prev => ({
        ...prev,
        total: allOrders.length,
        totalPages: Math.ceil(allOrders.length / prev.limit)
      }));
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.message || 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      // Fetch device inventory statistics
      const inventoryResponse = await authenticatedFetch(
        `${import.meta.env.VITE_APIURL}/api/device-inventory/statistics`
      );
      const inventoryData = await inventoryResponse.json();

      // Fetch device order statistics
      let purchaseStats = { pending: 0, contacted: 0, confirmed: 0, total: 0 };
      try {
        const orderResponse = await authenticatedFetch(
          `${import.meta.env.VITE_APIURL}/api/device-orders/statistics`
        );
        const orderData = await orderResponse.json();
        if (orderData.success && orderData.data) {
          purchaseStats = {
            pending: orderData.data.pending || 0,
            contacted: orderData.data.contacted || 0,
            confirmed: orderData.data.confirmed || 0,
            total: orderData.data.total || 0
          };
        }
      } catch (err) {
        console.error('Error fetching order statistics:', err);
      }

      if (inventoryData.success && inventoryData.data) {
        setStatistics({
          totalOrders: (inventoryData.data.soldCount || 0) + purchaseStats.total,
          completedOrders: inventoryData.data.soldCount || 0,
          pendingOrders: purchaseStats.pending + purchaseStats.contacted + purchaseStats.confirmed,
          totalRevenue: inventoryData.data.totalSoldValue || 0,
          purchaseRequests: purchaseStats.total
        });
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // Update order status
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(true);
      const response = await authenticatedFetch(
        `${import.meta.env.VITE_APIURL}/api/device-orders/${orderId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: newStatus })
        }
      );
      
      const data = await response.json();
      if (data.success) {
        // Refresh orders
        fetchOrders();
        setShowModal(false);
        alert('Order status updated successfully!');
      } else {
        alert('Failed to update status: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchStatistics();
  }, [pagination.page, filter, orderTypeFilter]);

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // View order details
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  // Filter orders based on search term
  const filteredOrders = (Array.isArray(orders) ? orders : []).filter(order => {
    const matchesSearch = 
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.device?.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.device?.model?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status) => {
    const badges = {
      completed: 'bg-green-100 text-green-800',
      delivered: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      contacted: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-purple-100 text-purple-800',
      paid: 'bg-indigo-100 text-indigo-800',
      shipped: 'bg-cyan-100 text-cyan-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      contacted: 'Contacted',
      confirmed: 'Confirmed',
      paid: 'Paid',
      shipped: 'Shipped',
      delivered: 'Delivered',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    return labels[status] || status;
  };

  const getPaymentBadge = (status) => {
    const badges = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      refunded: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString('en-IN')}`;
  };

  // Statistics Card Component
  const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow border p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
          <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mt-1`}>{value}</p>
          {subtext && (
            <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>{subtext}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading && orders.length === 0) {
    return (
      <div className={`p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading orders...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
          Order List
        </h1>
        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          View and manage all device sale orders
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="Total Orders"
          value={statistics.totalOrders}
          icon={FaShoppingCart}
          color="bg-blue-500"
        />
        <StatCard
          title="Purchase Requests"
          value={statistics.purchaseRequests}
          icon={FaClock}
          color="bg-orange-500"
          subtext="From website"
        />
        <StatCard
          title="Completed Sales"
          value={statistics.completedOrders}
          icon={FaCheckCircle}
          color="bg-green-500"
        />
        <StatCard
          title="Pending Action"
          value={statistics.pendingOrders}
          icon={FaClock}
          color="bg-yellow-500"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(statistics.totalRevenue)}
          icon={FaShoppingCart}
          color="bg-purple-500"
        />
      </div>

      {/* Order Type Tabs */}
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow border p-4 mb-4`}>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'All Orders' },
            { value: 'purchase-requests', label: '🛒 Purchase Requests (Website)' },
            { value: 'completed-sales', label: '✅ Completed Sales' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setOrderTypeFilter(option.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                orderTypeFilter === option.value
                  ? 'bg-purple-600 text-white'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters and Search */}
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow border p-4 mb-6`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
            />
          </div>

          {/* Status Filter (for purchase requests) */}
          {orderTypeFilter === 'purchase-requests' && (
            <div className="flex items-center gap-2">
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status:</span>
              {['all', 'pending', 'contacted', 'confirmed', 'paid', 'shipped', 'delivered'].map((statusOption) => (
                <button
                  key={statusOption}
                  onClick={() => handleFilterChange(statusOption)}
                  className={`px-3 py-1 text-sm rounded-lg capitalize transition-colors ${
                    filter === statusOption
                      ? 'bg-purple-600 text-white'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {statusOption}
                </button>
              ))}
            </div>
          )}

          {/* Category Filter (for completed sales) */}
          {orderTypeFilter !== 'purchase-requests' && (
            <div className="flex items-center gap-2">
              <FaFilter className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              {['all', 'sale', 'used', 'exchange'].map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => handleFilterChange(filterOption)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === filterOption
                      ? 'bg-purple-600 text-white'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={() => { fetchOrders(); fetchStatistics(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isDarkMode 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FaSync className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          <p>{error}</p>
          <button
            onClick={fetchOrders}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Orders Table */}
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow border overflow-hidden`}>
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center">
            <FaShoppingCart className={`mx-auto text-4xl ${isDarkMode ? 'text-gray-600' : 'text-gray-400'} mb-4`} />
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No orders found
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Order Details
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Device
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Customer
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Price
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Status
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Date
                    </th>
                    <th className={`px-6 py-3 text-center text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {order.orderNumber}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {order.orderType === 'purchase-request' ? (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                              🛒 Website Request
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              ✅ Completed Sale
                            </span>
                          )}
                        </div>
                        <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {order.device?.category?.toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {order.device?.image ? (
                            <img
                              src={order.device.image}
                              alt={`${order.device.brand} ${order.device.model}`}
                              className="w-10 h-10 rounded object-cover mr-3"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center mr-3">
                              <FaShoppingCart className="text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {order.device?.brand} {order.device?.model}
                            </div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {order.device?.storage} • {order.device?.color}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {order.customer?.name}
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {order.customer?.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-green-600">
                          {formatCurrency(order.soldPrice)}
                        </div>
                        {order.originalPrice !== order.soldPrice && (
                          <div className={`text-xs line-through ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {formatCurrency(order.originalPrice)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                        </span>
                        <div className="mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentBadge(order.paymentStatus)}`}>
                            {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {formatDate(order.soldDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="inline-flex items-center px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                        >
                          <FaEye className="mr-1" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className={`px-6 py-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} orders)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`p-2 rounded ${
                      pagination.page === 1
                        ? 'opacity-50 cursor-not-allowed'
                        : isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    } ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                  >
                    <FaChevronLeft />
                  </button>
                  <span className={`px-3 py-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {pagination.page}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className={`p-2 rounded ${
                      pagination.page === pagination.totalPages
                        ? 'opacity-50 cursor-not-allowed'
                        : isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    } ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto`}>
            <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center">
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Order Details - {selectedOrder.orderNumber}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <FaTimesCircle className={`text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Device Info */}
              <div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                  Device Information
                </h3>
                <div className="flex items-start gap-4">
                  {selectedOrder.device?.image ? (
                    <img
                      src={selectedOrder.device.image}
                      alt={`${selectedOrder.device.brand} ${selectedOrder.device.model}`}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center">
                      <FaShoppingCart className="text-2xl text-gray-400" />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 flex-1">
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Brand</p>
                      <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.device?.brand}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Model</p>
                      <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.device?.model}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Storage</p>
                      <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.device?.storage}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Color</p>
                      <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.device?.color || 'N/A'}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Condition</p>
                      <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} capitalize`}>{selectedOrder.device?.condition?.replace('-', ' ')}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Category</p>
                      <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} capitalize`}>{selectedOrder.device?.category}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                  Customer Information
                </h3>
                <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <FaUser className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Name</p>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.customer?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FaPhone className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Phone</p>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.customer?.phone}</p>
                      </div>
                    </div>
                    {selectedOrder.customer?.email && (
                      <div className="flex items-center gap-3 md:col-span-2">
                        <FaEnvelope className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <div>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</p>
                          <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.customer.email}</p>
                        </div>
                      </div>
                    )}
                    {selectedOrder.customer?.address && (
                      <div className="md:col-span-2">
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Address</p>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.customer.address}</p>
                      </div>
                    )}
                    {selectedOrder.customer?.message && (
                      <div className="md:col-span-2">
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Customer Message</p>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} italic`}>"{selectedOrder.customer.message}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Update Section - Only for purchase requests */}
              {selectedOrder.orderType === 'purchase-request' && (
                <div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                    Update Status
                  </h3>
                  <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                    <div className="flex flex-wrap gap-2">
                      {['pending', 'contacted', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled'].map((statusOption) => (
                        <button
                          key={statusOption}
                          onClick={() => handleUpdateStatus(selectedOrder.id, statusOption)}
                          disabled={updatingStatus || selectedOrder.status === statusOption}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedOrder.status === statusOption
                              ? 'bg-purple-600 text-white cursor-default'
                              : statusOption === 'cancelled'
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : isDarkMode
                                  ? 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          } disabled:opacity-50`}
                        >
                          {updatingStatus ? 'Updating...' : getStatusLabel(statusOption)}
                        </button>
                      ))}
                    </div>
                    <p className={`text-xs mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Click a status button to update this order's status
                    </p>
                  </div>
                </div>
              )}

              {/* Payment Info */}
              <div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                  Payment Information
                </h3>
                <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Original Price</p>
                      <p className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{formatCurrency(selectedOrder.originalPrice)}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sold Price</p>
                      <p className="font-bold text-xl text-green-600">{formatCurrency(selectedOrder.soldPrice)}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Order Status</p>
                      <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedOrder.status)}`}>
                        {selectedOrder.status?.charAt(0).toUpperCase() + selectedOrder.status?.slice(1)}
                      </span>
                    </div>
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Payment Status</p>
                      <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${getPaymentBadge(selectedOrder.paymentStatus)}`}>
                        {selectedOrder.paymentStatus?.charAt(0).toUpperCase() + selectedOrder.paymentStatus?.slice(1)}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sale Date</p>
                      <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatDate(selectedOrder.soldDate)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => window.print()}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FaPrint />
                  Print
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;
