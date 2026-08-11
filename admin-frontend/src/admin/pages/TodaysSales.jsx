import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const TodaysSales = () => {
  const [saleOrders, setSaleOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasMore: false,
    itemsPerPage: 10,
    itemsInCurrentPage: 0
  });
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Order details modal state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Totals data for today's sales
  const [totalsData, setTotalsData] = useState({
    totalValue: 0,
    totalTaxable: 0,
    totalTax: 0,
    totalDiscount: 0
  });

  // Date filter state similar to GST R1 Report
  const [dateFilter, setDateFilter] = useState('today');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Search filter state
  const [searchText, setSearchText] = useState('');

  // Date range helper function similar to GST R1
  const getDateRange = (filterType) => {
    const today = new Date();
    const startDate = new Date();
    const endDate = new Date();

    switch (filterType) {
      case 'today':
        return { 
          start: today.toISOString().split('T')[0], 
          end: today.toISOString().split('T')[0] 
        };

      case 'yesterday':
        startDate.setDate(today.getDate() - 1);
        return { 
          start: startDate.toISOString().split('T')[0], 
          end: startDate.toISOString().split('T')[0] 
        };

      case 'weekly':
        startDate.setDate(today.getDate() - 7);
        return { 
          start: startDate.toISOString().split('T')[0], 
          end: today.toISOString().split('T')[0] 
        };

      case 'thisMonth':
        startDate.setDate(1);
        return { 
          start: startDate.toISOString().split('T')[0], 
          end: today.toISOString().split('T')[0] 
        };

      case 'previousMonth':
        startDate.setMonth(today.getMonth() - 1);
        startDate.setDate(1);
        endDate.setDate(0); // Last day of previous month
        return { 
          start: startDate.toISOString().split('T')[0], 
          end: endDate.toISOString().split('T')[0] 
        };

      case 'quarterly':
        startDate.setMonth(Math.floor(today.getMonth() / 3) * 3);
        startDate.setDate(1);
        endDate.setMonth(Math.floor(today.getMonth() / 3) * 3 + 2);
        endDate.setDate(new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate());
        return { 
          start: startDate.toISOString().split('T')[0], 
          end: endDate.toISOString().split('T')[0] 
        };

      case 'halfYear':
        startDate.setMonth(Math.floor(today.getMonth() / 6) * 6);
        startDate.setDate(1);
        endDate.setMonth(Math.floor(today.getMonth() / 6) * 6 + 5);
        endDate.setDate(new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate());
        return { 
          start: startDate.toISOString().split('T')[0], 
          end: endDate.toISOString().split('T')[0] 
        };

      case 'financialYear':
        const month = today.getMonth();
        if (month < 3) { // Jan to March
          startDate.setFullYear(today.getFullYear() - 1);
          startDate.setMonth(3);
          startDate.setDate(1);
          endDate.setMonth(2);
          endDate.setDate(31);
        } else { // April to Dec
          startDate.setMonth(3);
          startDate.setDate(1);
          endDate.setFullYear(today.getFullYear() + 1);
          endDate.setMonth(2);
          endDate.setDate(31);
        }
        return { 
          start: startDate.toISOString().split('T')[0], 
          end: endDate.toISOString().split('T')[0] 
        };

      case 'custom':
        return {
          start: fromDate,
          end: toDate
        };

      default:
        return { 
          start: today.toISOString().split('T')[0], 
          end: today.toISOString().split('T')[0] 
        };
    }
  };

  // Calculate totals function
  const calculateTotals = (orders) => {
    console.log('Calculating totals for orders:', orders.length);
    
    return orders.reduce((acc, order) => {
      console.log(`Processing order ${order.orderId || order.ticketNumber}:`, {
        total: order.total,
        tax: order.tax,
        discount: order.discount,
        items: order.items?.length || 0
      });
      
      // Add order total (regardless of status - shows total business value)
      acc.totalValue += order.total || 0;
      
      // Calculate discount amount from percentage (applied to total amount including tax)
      let orderDiscountAmount = 0;
      if (order.discount && order.discount > 0) {
        // Calculate total amount first (subtotal + tax)
        const orderSubtotal = order.items?.reduce((sum, item) => {
          return sum + ((item.pricePerUnit || 0) * (item.quantity || 1));
        }, 0) || 0;
        
        // Calculate tax amount
        let orderTaxAmount = 0;
        if (order.tax && order.tax > 0) {
          orderTaxAmount = (orderSubtotal * (order.tax / 100));
        }
        
        // Apply discount to total amount (subtotal + tax)
        const totalBeforeDiscount = orderSubtotal + orderTaxAmount;
        orderDiscountAmount = (totalBeforeDiscount * (order.discount / 100));
        console.log(`  Order discount: ${order.discount}% of ${totalBeforeDiscount} = ${orderDiscountAmount}`);
      }
      acc.totalDiscount += orderDiscountAmount;
      
      // Calculate tax properly - treat tax field as percentage, not amount
      let orderTaxAmount = 0;
      let itemsTaxAmount = 0;
      let taxableAmount = 0;
      
      // Order level tax calculation (if order has tax percentage)
      if (order.tax && order.tax > 0) {
        const orderSubtotal = (order.total || 0) - (order.tax || 0) + (order.discount || 0);
        orderTaxAmount = (orderSubtotal * (order.tax / 100));
        console.log(`  Order tax: ${order.tax}% of ${orderSubtotal} = ${orderTaxAmount}`);
      }
      
      order.items?.forEach(item => {
        const itemTaxPercent = item.tax || 0;
        const itemQuantity = item.quantity || 1;
        const itemBasePrice = (item.pricePerUnit || 0) * itemQuantity;
        
        // If item has tax percentage, calculate tax amount
        if (itemTaxPercent > 0) {
          const itemTaxAmount = (itemBasePrice * (itemTaxPercent / 100));
          itemsTaxAmount += itemTaxAmount;
          taxableAmount += itemBasePrice;
          console.log(`  Item: ${item.description}, basePrice=${itemBasePrice}, tax=${itemTaxPercent}%, taxAmount=${itemTaxAmount}`);
        }
      });
      
      // Total tax amount (calculated from percentages)
      const totalTaxAmount = orderTaxAmount + itemsTaxAmount;
      acc.totalTax += totalTaxAmount;
      
      // Taxable amount calculation
      if (orderTaxAmount > 0) {
        const orderSubtotal = order.items?.reduce((sum, item) => {
          return sum + ((item.pricePerUnit || 0) * (item.quantity || 1));
        }, 0) || 0;
        acc.totalTaxable += orderSubtotal;
      }
      acc.totalTaxable += taxableAmount;
      
      console.log(`  Final order totals: tax=${totalTaxAmount}, taxable=${taxableAmount}, discount=${orderDiscountAmount}`);
      
      return acc;
    }, { totalValue: 0, totalTaxable: 0, totalTax: 0, totalDiscount: 0 });
  };

  // Fetch paid orders function with date filter support
  const fetchPaidOrders = async (page = 1) => {
    try {
      setLoading(true);
      
      // Get date range based on current filter
      const dateRange = getDateRange(dateFilter);
      
      // Build query parameters for paid status with date range using paidAt field
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        status: 'Paid',
        paidFrom: dateRange.start,
        paidTo: dateRange.end
      });

      const apiUrl = `${import.meta.env.VITE_APIURL}/api/sale-orders?${queryParams}`;
      console.log('Fetching paid orders from:', apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch paid orders');

      const data = await response.json();
      console.log('API Response:', data);

      if (data.success) {
        setSaleOrders(data.data || []);
        setPagination(data.pagination || {});
        
        // Fetch totals for all matching paid records
        await fetchPaidOrdersTotals();
      } else {
        throw new Error(data.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching paid orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch totals for all matching paid records
  const fetchPaidOrdersTotals = async () => {
    try {
      // Get date range based on current filter
      const dateRange = getDateRange(dateFilter);
      
      const queryParams = new URLSearchParams({
        page: '1',
        limit: '1000', // fetch up to 1000 records for totals calculation
        status: 'Paid',
        paidFrom: dateRange.start,
        paidTo: dateRange.end
      });

      const apiUrl = `${import.meta.env.VITE_APIURL}/api/sale-orders?${queryParams}`;
      console.log('Fetching totals from:', apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch totals');

      const data = await response.json();
      if (data.success && data.data) {
        const calculatedTotals = calculateTotals(data.data);
        setTotalsData(calculatedTotals);
        console.log('Calculated totals:', calculatedTotals);
      }
    } catch (err) {
      console.error('Error fetching totals:', err);
    }
  };

  // Handle order click to show details
  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchPaidOrders(newPage);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setItemsPerPage(newLimit);
    setCurrentPage(1);
    fetchPaidOrders(1);
  };

  // Handle date filter change
  const handleDateFilterChange = (filter) => {
    setDateFilter(filter);
    if (filter !== 'custom') {
      const range = getDateRange(filter);
      setFromDate(range.start);
      setToDate(range.end);
    }
    setCurrentPage(1);
    // Will trigger fetch in useEffect when dateFilter changes
  };

  // Handle custom date changes
  const handleFromDateChange = (date) => {
    setFromDate(date);
    setDateFilter('custom');
    setCurrentPage(1);
  };

  const handleToDateChange = (date) => {
    setToDate(date);
    setDateFilter('custom');
    setCurrentPage(1);
  };

  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1);
    fetchPaidOrders(1);
  };

  // Filter orders based on search text (name, phone, ticket number without TC)
  const getFilteredOrders = () => {
    if (!searchText.trim()) {
      return saleOrders;
    }
    
    const searchLower = searchText.trim().toLowerCase();
    
    return saleOrders.filter(order => {
      // Search by customer name
      const nameMatch = (order.customerName || '').toLowerCase().includes(searchLower);
      
      // Search by phone number
      const phoneMatch = (order.phone || '').includes(searchText.trim()) ||
                         (order.alternatePhone || '').includes(searchText.trim());
      
      // Search by ticket number (without TC prefix)
      const ticketNumber = order.ticketNumber || order.orderId || '';
      // Remove "TC" prefix for comparison if present
      const ticketWithoutTC = ticketNumber.replace(/^TC/i, '');
      const ticketMatch = ticketWithoutTC.toLowerCase().includes(searchLower) ||
                          ticketNumber.toLowerCase().includes(searchLower);
      
      return nameMatch || phoneMatch || ticketMatch;
    });
  };

  // Get filtered orders
  const filteredOrders = getFilteredOrders();

  // Refresh data
  const handleRefresh = () => {
    setCurrentPage(1);
    fetchPaidOrders(1);
  };

  // Export to Excel
  const handleExportExcel = async () => {
    try {
      // Get date range based on current filter
      const dateRange = getDateRange(dateFilter);
      
      // Fetch all paid orders for the selected date range
      const queryParams = new URLSearchParams({
        page: '1',
        limit: '10000', // Fetch all records for export
        status: 'Paid',
        paidFrom: dateRange.start,
        paidTo: dateRange.end
      });

      const apiUrl = `${import.meta.env.VITE_APIURL}/api/sale-orders?${queryParams}`;
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch orders for export');

      const data = await response.json();
      const allOrders = data.data || [];
      
      if (!allOrders.length) {
        alert('No data to export');
        return;
      }

      // Prepare data for Excel
      const exportData = allOrders.map((order, index) => ({
        'Sr. No': index + 1,
        'Ticket No': order.ticketNumber || order.orderId || '-',
        'Customer Name': order.customerName || '-',
        'Phone': order.phone || order.alternatePhone || '-',
        'Serial Number': order.serialNumber || '-',
        'IMEI Number': order.imeiNumber || '-',
        'Color': order.color || '-',
        'Paid Date': order.paidAt ? new Date(order.paidAt).toLocaleDateString('en-IN') : '-',
        'Paid Time': order.paidAt ? new Date(order.paidAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-',
        'Status': order.status || 'Paid',
        'Payment Type': order.paymentType || 'UPI',
        'Total (₹)': order.total || 0
      }));

      // Add summary row
      exportData.push({});
      exportData.push({
        'Sr. No': '',
        'Ticket No': 'SUMMARY',
        'Customer Name': '',
        'Phone': '',
        'Serial Number': '',
        'IMEI Number': '',
        'Color': '',
        'Paid Date': '',
        'Paid Time': '',
        'Status': '',
        'Payment Type': '',
        'Total (₹)': totalsData.totalValue
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Paid Sales Report');

      // Generate filename with date range
      const fileName = `PaidSalesReport_${dateRange.start}_to_${dateRange.end}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      alert('Failed to export report. Please try again.');
    }
  };

  // Initialize dates and fetch data
  useEffect(() => {
    // Initialize dates based on default filter (today)
    const range = getDateRange('today');
    setFromDate(range.start);
    setToDate(range.end);
    fetchPaidOrders(1);
  }, []);

  // Fetch data when date filter changes
  useEffect(() => {
    if (dateFilter !== 'custom') {
      fetchPaidOrders(currentPage);
    }
  }, [dateFilter]);

  // Custom date filter only fetches on "Apply Filter" button click (applyFilters function)
  // No auto-fetch on date change to avoid search while navigating calendar months

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Error: {error}</p>
        <button 
          onClick={handleRefresh}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paid Sales Report</h1>
          <p className="text-gray-600 mt-1">
            {dateFilter === 'today' ? (
              `Today's paid orders - ${new Date().toLocaleDateString('en-IN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}`
            ) : dateFilter === 'custom' ? (
              `Custom date range: ${fromDate ? new Date(fromDate).toLocaleDateString('en-IN') : 'N/A'} to ${toDate ? new Date(toDate).toLocaleDateString('en-IN') : 'N/A'}`
            ) : (
              `${dateFilter.charAt(0).toUpperCase() + dateFilter.slice(1)} paid orders`
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Excel
          </button>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Date Filter Section */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Options</h3>
        
        {/* Search Input */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1">Search by Name, Phone, or Ticket No</label>
          <div className="relative">
            <input
              type="text"
              className="w-full p-2 pl-10 border rounded"
              placeholder="Enter name, phone, or ticket number (without TC)..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <svg 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchText && (
              <button
                onClick={() => setSearchText('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Date Filter</label>
            <select 
              className="w-full p-2 border rounded"
              value={dateFilter}
              onChange={(e) => handleDateFilterChange(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="weekly">Last 7 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="previousMonth">Previous Month</option>
              <option value="quarterly">Quarterly</option>
              <option value="halfYear">Half Year</option>
              <option value="financialYear">Financial Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div className={`${dateFilter === 'custom' ? 'block' : 'hidden'}`}>
            <label className="block text-sm text-gray-600 mb-1">From Date</label>
            <input
              type="date"
              className="w-full p-2 border rounded"
              value={fromDate}
              onChange={(e) => handleFromDateChange(e.target.value)}
            />
          </div>

          <div className={`${dateFilter === 'custom' ? 'block' : 'hidden'}`}>
            <label className="block text-sm text-gray-600 mb-1">To Date</label>
            <input
              type="date"
              className="w-full p-2 border rounded"
              value={toDate}
              onChange={(e) => handleToDateChange(e.target.value)}
            />
          </div>

          {dateFilter !== 'custom' && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">Selected Date Range</label>
              <div className="w-full p-2 border rounded bg-gray-50 text-sm">
                {fromDate && toDate ? (
                  `${new Date(fromDate).toLocaleDateString('en-IN')} to ${new Date(toDate).toLocaleDateString('en-IN')}`
                ) : (
                  'Loading...'
                )}
              </div>
            </div>
          )}

          {dateFilter === 'custom' && (
            <div className="flex items-end">
              <button
                onClick={applyFilters}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Apply Filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Value</h3>
          <p className="text-2xl font-bold text-blue-600">₹{Math.round(totalsData.totalValue)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Taxable</h3>
          <p className="text-2xl font-bold text-green-600">₹{Math.round(totalsData.totalTaxable)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Tax</h3>
          <p className="text-2xl font-bold text-orange-600">₹{Math.round(totalsData.totalTax)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Discount</h3>
          <p className="text-2xl font-bold text-red-600">₹{Math.round(totalsData.totalDiscount)}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            Showing {filteredOrders.length} of {pagination.totalCount} records
            {searchText && ` (filtered from ${saleOrders.length})`}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Items per page:</label>
          <select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ticket #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    {searchText ? 'No matching records found' : 'No paid sales found for the selected date range'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr 
                    key={order._id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleOrderClick(order)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">
                        {order.ticketNumber || order.orderId || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.customerName || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.phone || order.alternatePhone || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        S/N: {order.serialNumber || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        IMEI: {order.imeiNumber || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Color: {order.color || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.paidAt ? new Date(order.paidAt).toLocaleDateString('en-IN') : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.paidAt ? new Date(order.paidAt).toLocaleTimeString('en-IN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        }) : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Paid
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{order.total || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.paymentType || 'UPI'}
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
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, pagination.totalCount)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.totalCount}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNumber;
                    if (pagination.totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNumber = pagination.totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNumber
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  📋 Order Details - {selectedOrder.ticketNumber || selectedOrder.orderId}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Paid: {selectedOrder.paidAt ? new Date(selectedOrder.paidAt).toLocaleDateString('en-IN') : 'N/A'} • 
                  Status: {selectedOrder.status}
                </p>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {/* Quick Financial Summary Card */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 rounded-full p-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Payment Summary</h4>
                        <p className="text-xs text-gray-600">Quick Financial Overview</p>
                      </div>
                    </div>
                    {(() => {
                      const subtotal = selectedOrder.items?.reduce((sum, item) => {
                        return sum + ((item.pricePerUnit || 0) * (item.quantity || 1));
                      }, 0) || 0;
                      const taxAmount = (selectedOrder.tax || 0) > 0 ? (subtotal * ((selectedOrder.tax || 0) / 100)) : 0;
                      const totalBeforeDiscount = subtotal + taxAmount;
                      const discountAmount = (selectedOrder.discount || 0) > 0 ? (totalBeforeDiscount * ((selectedOrder.discount || 0) / 100)) : 0;
                      const finalTotal = totalBeforeDiscount - discountAmount;
                      const advancedAmount = selectedOrder.advanced || selectedOrder.advance || 0;
                      // If order is marked as paid, balance is 0
                      const isPaid = selectedOrder.status === 'paid' || selectedOrder.paidAt;
                      const balanceAmount = isPaid ? 0 : (finalTotal - advancedAmount);
                      
                      return (
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">₹{finalTotal.toFixed(2)}</div>
                          <div className="text-xs text-gray-600">
                            {isPaid || balanceAmount === 0 ? (
                              <span className="text-green-600 font-medium">✅ Fully Paid</span>
                            ) : balanceAmount > 0 ? (
                              <span className="text-orange-600 font-medium">₹{balanceAmount.toFixed(2)} pending</span>
                            ) : (
                              <span className="text-green-600 font-medium">💰 Overpaid ₹{Math.abs(balanceAmount).toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium mb-2">Customer Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span> {selectedOrder.customerName || 'N/A'}
                    </div>
                    <div>
                      <span className="text-gray-600">Contact:</span> {selectedOrder.phone || selectedOrder.alternatePhone || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Device Details */}
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium mb-2">📱 Device Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Device Model:</span> {
                        typeof selectedOrder.deviceModel === 'object' && selectedOrder.deviceModel?.name 
                          ? selectedOrder.deviceModel.name 
                          : typeof selectedOrder.model === 'object' && selectedOrder.model?.name
                          ? selectedOrder.model.name
                          : selectedOrder.deviceModel || selectedOrder.model || 'N/A'
                      }
                    </div>
                    <div>
                      <span className="text-gray-600">Color:</span> {
                        typeof selectedOrder.color === 'object' && selectedOrder.color?.name 
                          ? selectedOrder.color.name 
                          : selectedOrder.color || 'N/A'
                      }
                    </div>
                    <div>
                      <span className="text-gray-600">Serial Number:</span> {selectedOrder.serialNumber || 'N/A'}
                    </div>
                    <div>
                      <span className="text-gray-600">IMEI Number:</span> {selectedOrder.imeiNumber || 'N/A'}
                    </div>
                    {selectedOrder.storage && (
                      <div>
                        <span className="text-gray-600">Storage:</span> {
                          typeof selectedOrder.storage === 'object' && selectedOrder.storage?.name 
                            ? selectedOrder.storage.name 
                            : selectedOrder.storage
                        }
                      </div>
                    )}
                    {selectedOrder.problemDescription && (
                      <div className="col-span-2">
                        <span className="text-gray-600">Problem:</span> {selectedOrder.problemDescription}
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Information */}
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium mb-2">Order Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Created:</span> {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                    </div>
                    <div>
                      <span className="text-gray-600">Paid:</span> {selectedOrder.paidAt ? new Date(selectedOrder.paidAt).toLocaleString('en-IN') : 'N/A'}
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span> 
                      <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Payment Method:</span> {selectedOrder.paymentType || 'UPI'}
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium mb-2">💰 Financial</h4>
                  <div className="space-y-3">
                    {(() => {
                      // Calculate financial details
                      const subtotal = selectedOrder.items?.reduce((sum, item) => {
                        return sum + ((item.pricePerUnit || 0) * (item.quantity || 1));
                      }, 0) || 0;
                      
                      const taxPercent = selectedOrder.tax || 0;
                      const discountPercent = selectedOrder.discount || 0;
                      
                      // Calculate tax amount
                      const taxAmount = taxPercent > 0 ? (subtotal * (taxPercent / 100)) : 0;
                      
                      // Calculate total before discount
                      const totalBeforeDiscount = subtotal + taxAmount;
                      
                      // Calculate discount amount (applied to total including tax)
                      const discountAmount = discountPercent > 0 ? (totalBeforeDiscount * (discountPercent / 100)) : 0;
                      
                      // Final total after discount
                      const finalTotal = totalBeforeDiscount - discountAmount;
                      
                      // Payment details
                      const advancedAmount = selectedOrder.advanced || selectedOrder.advance || 0;
                      // If order is marked as paid, balance is 0
                      const isPaid = selectedOrder.status === 'paid' || selectedOrder.paidAt;
                      const balanceAmount = isPaid ? 0 : (finalTotal - advancedAmount);
                      
                      return (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                          </div>
                          {taxAmount > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Tax ({taxPercent}%):</span>
                              <span className="font-medium">₹{taxAmount.toFixed(2)}</span>
                            </div>
                          )}
                          {discountAmount > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Discount ({discountPercent}%):</span>
                              <span className="font-medium text-red-600">-₹{discountAmount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between border-t pt-2 font-semibold">
                            <span className="text-gray-900">Total:</span>
                            <span className="text-gray-900">₹{finalTotal.toFixed(2)}</span>
                          </div>
                          {advancedAmount > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Advanced:</span>
                              <span className="font-medium text-green-600">₹{advancedAmount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">Balance:</span>
                            <span className={`font-medium ${isPaid ? 'text-green-600' : (balanceAmount > 0 ? 'text-orange-600' : 'text-green-600')}`}>
                              {isPaid ? '✅ Fully Paid' : `₹${balanceAmount.toFixed(2)}`}
                            </span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-gray-600">Payment Method:</span>
                            <span className="font-medium">{selectedOrder.paymentType || 'UPI'}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Items/Services */}
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-medium mb-2">🔧 Items/Services</h4>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="bg-white p-3 rounded border">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.issue || item.description || 'Service Item'}</p>
                              {item.description && item.issue && (
                                <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                              )}
                              <div className="text-xs text-gray-600 mt-1">
                                <span>Qty: {item.quantity || 1}</span>
                                <span className="ml-3">Rate: ₹{(item.pricePerUnit || 0).toFixed(2)}</span>
                                {item.discount > 0 && <span className="ml-3 text-red-600">Discount: {item.discount}%</span>}
                                {item.tax > 0 && <span className="ml-3">Tax: {item.tax}%</span>}
                                {item.warranty && <span className="ml-3 text-green-600">Warranty: {item.warranty}</span>}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-sm">₹{(item.amount || ((item.pricePerUnit || 0) * (item.quantity || 1))).toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="border-t pt-2 mt-3 bg-white rounded p-2">
                        <div className="flex justify-between font-medium text-sm">
                          <span>Items Subtotal:</span>
                          <span>₹{selectedOrder.items.reduce((sum, item) => sum + (item.amount || ((item.pricePerUnit || 0) * (item.quantity || 1))), 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodaysSales;