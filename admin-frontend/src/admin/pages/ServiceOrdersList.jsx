import React, { useEffect, useState } from 'react';
import BillingFilterBar from '../../components/invoice/BillingFilterBar';
import ServiceOrdersTable from '../../components/invoice/ServiceOrdersTable';
import { useTheme } from '../../context/ThemeContext';

const ServiceOrdersList = () => {
  const { isDarkMode } = useTheme();
  const [serviceOrders, setServiceOrders] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, pageSize: 10, totalPages: 1, totalRecords: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch service orders from API
  const fetchServiceOrders = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('accessToken');
      
      // Try multiple endpoints to ensure we get data
      let res;
      try {
        res = await fetch(`${import.meta.env.VITE_APIURL}/api/sale-orders?page=${page}&pageSize=${pageSize}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.log('Primary endpoint failed, trying filter endpoint...');
        res = await fetch(`${import.meta.env.VITE_APIURL}/api/sale-orders/filter?page=${page}&pageSize=${pageSize}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      
      const data = await res.json();
      console.log('Service Orders API Response:', data); // Debug log
      
      if (data.status === 'Success' || data.success) {
        setServiceOrders(data.data || []);
        setPagination(data.pagination || { currentPage: page, pageSize, totalPages: 1, totalRecords: data.data?.length || 0 });
      } else {
        setServiceOrders([]);
        setPagination({ currentPage: 1, pageSize: 10, totalPages: 1, totalRecords: 0 });
        setError('No service orders found');
      }
    } catch (err) {
      console.error('Service orders fetch error:', err);
      setError('Failed to fetch service orders');
      setServiceOrders([]);
      setPagination({ currentPage: 1, pageSize: 10, totalPages: 1, totalRecords: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchServiceOrders(1, pagination.pageSize); 
  }, []);

  const handleFilterChange = (filters) => {
    console.log('Filter changed:', filters);
    // Apply filters to the orders list
    fetchOrdersWithFilters(filters);
  };

  const fetchOrdersWithFilters = async (filters, page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('accessToken');
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString()
      });

      if (filters.search) queryParams.append('search', filters.search);
      if (filters.customerName) queryParams.append('customerName', filters.customerName);
      if (filters.phone) queryParams.append('phone', filters.phone);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);

      const res = await fetch(`${import.meta.env.VITE_APIURL}/api/sale-orders/filter?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      console.log('Filtered Service Orders API Response:', data);
      
      if (data.status === 'Success' || data.success) {
        setServiceOrders(data.data || []);
        setPagination(data.pagination || { currentPage: page, pageSize, totalPages: 1, totalRecords: data.data?.length || 0 });
      } else {
        setServiceOrders([]);
        setPagination({ currentPage: 1, pageSize: 10, totalPages: 1, totalRecords: 0 });
        setError('No matching records found');
      }
    } catch (err) {
      console.error('Filtered service orders fetch error:', err);
      setError('Failed to fetch filtered data');
      setServiceOrders([]);
      setPagination({ currentPage: 1, pageSize: 10, totalPages: 1, totalRecords: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    fetchServiceOrders(newPage, pagination.pageSize);
  };
  
  const handlePageSizeChange = (newSize) => {
    fetchServiceOrders(1, newSize);
  };

  return (
    <div className={`min-h-screen p-6 bg-gradient-to-br from-blue-50 to-white ${isDarkMode ? 'dark' : ''}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Service Orders</h1>
          <p className="text-gray-600">View all service orders and their details</p>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-blue-100">
          <BillingFilterBar onFilter={handleFilterChange} />
        </div>

        {/* Error State */}
        {error && !loading && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-red-200">
            <div className="text-center">
              <div className="text-red-600 mb-4">⚠️ Error</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load service orders</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <button 
                onClick={() => fetchServiceOrders(1, pagination.pageSize)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-gray-600">Loading service orders...</div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && serviceOrders.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-gray-400 mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No service orders found</h3>
            <p className="text-gray-500">There are currently no service orders to display.</p>
          </div>
        )}

        {/* Service Orders Table */}
        {!loading && !error && serviceOrders.length > 0 && (
          <ServiceOrdersTable
            orders={serviceOrders}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </div>
    </div>
  );
};

export default ServiceOrdersList;
