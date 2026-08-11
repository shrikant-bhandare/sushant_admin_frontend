import React, { useEffect, useState } from 'react';
import BillingFilterBar from '../../components/invoice/BillingFilterBar';
import BillingInvoiceTable from '../../components/invoice/BillingInvoiceTable';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const Billing = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, pageSize: 10, totalPages: 1, totalRecords: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch sale orders from API
  const fetchInvoices = async (page = 1, pageSize = 10) => {
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
        // Fallback to filter endpoint
        res = await fetch(`${import.meta.env.VITE_APIURL}/api/sale-orders/filter?page=${page}&pageSize=${pageSize}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      
      const data = await res.json();
      console.log('Billing API Response:', data); // Debug log
      
      if (data.status === 'Success' || data.success) {
        setInvoices(data.data || []);
        setPagination(data.pagination || { currentPage: page, pageSize, totalPages: 1, totalRecords: data.data?.length || 0 });
      } else {
        setInvoices([]);
        setPagination({ currentPage: 1, pageSize: 10, totalPages: 1, totalRecords: 0 });
        setError('No billing data found');
      }
    } catch (err) {
      console.error('Billing fetch error:', err);
      setError('Failed to fetch billing data');
      setInvoices([]);
      setPagination({ currentPage: 1, pageSize: 10, totalPages: 1, totalRecords: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(1, pagination.pageSize); }, []);

  const handleFilterChange = (filters) => {
    console.log('Filter changed:', filters);
    // Apply filters to the invoice list
    fetchInvoicesWithFilters(filters);
  };

  const fetchInvoicesWithFilters = async (filters, page = 1, pageSize = 10) => {
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
      console.log('Filtered Billing API Response:', data);
      
      if (data.status === 'Success' || data.success) {
        setInvoices(data.data || []);
        setPagination(data.pagination || { currentPage: page, pageSize, totalPages: 1, totalRecords: data.data?.length || 0 });
      } else {
        setInvoices([]);
        setPagination({ currentPage: 1, pageSize: 10, totalPages: 1, totalRecords: 0 });
        setError('No matching records found');
      }
    } catch (err) {
      console.error('Filtered billing fetch error:', err);
      setError('Failed to fetch filtered data');
      setInvoices([]);
      setPagination({ currentPage: 1, pageSize: 10, totalPages: 1, totalRecords: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    fetchInvoices(newPage, pagination.pageSize);
  };
  const handlePageSizeChange = (newSize) => {
    fetchInvoices(1, newSize);
  };
  const handleCreateInvoice = () => {
    navigate('/admin/billing/new');
  };

  return (
    <div className={`min-h-screen p-6 bg-gradient-to-br from-blue-50 to-white ${isDarkMode ? 'dark' : ''}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Billing & Invoices</h1>
          <p className="text-gray-600">Manage sale orders and billing information</p>
        </div>

        {/* Filter and Create Button */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-blue-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
                      <BillingFilterBar onFilter={handleFilterChange} />
            </div>
            <button
              onClick={handleCreateInvoice}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow font-semibold transition-colors duration-200 whitespace-nowrap"
            >
              Create New Invoice
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600 font-medium">Error: {error}</div>
              <button 
                onClick={() => fetchInvoices(1, pagination.pageSize)}
                className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-gray-600">Loading billing data...</div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && invoices.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-blue-100">
            <div className="text-gray-500 text-lg mb-4">No billing records found</div>
            <p className="text-gray-400 mb-6">Create your first invoice to get started</p>
            <button
              onClick={handleCreateInvoice}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow font-semibold transition-colors duration-200"
            >
              Create New Invoice
            </button>
          </div>
        )}

        {/* Invoices Table */}
        {!loading && !error && invoices.length > 0 && (
          <BillingInvoiceTable
            invoices={invoices}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onRefresh={() => fetchInvoices(pagination.currentPage, pagination.pageSize)}
          />
        )}
      </div>
    </div>
  );
};

export default Billing;