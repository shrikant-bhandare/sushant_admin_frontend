import React, { useState, useEffect } from 'react';
import AdminUpdateOrderModal from '../components/AdminUpdateOrderModal';

const RepairHistory = () => {
  const [saleOrders, setSaleOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Report state
  const [reportData, setReportData] = useState([]);
  const [reportType, setReportType] = useState(''); // 'taxable' or 'non-taxable'
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  // Edit Status Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  // Full update modal (admin)
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  // Changes log displayed after a successful update
  const [changesLog, setChangesLog] = useState(null); // { ticketNumber, changes, timestamp }

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

  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    from: '',
    to: ''
  });

  // Status filter state
  const [statusFilter, setStatusFilter] = useState('');

  // Order details modal state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Date filter state similar to GST R1 Report
  const [dateFilter, setDateFilter] = useState('custom');
  const [totalsData, setTotalsData] = useState({
    totalValue: 0,
    totalTaxable: 0,
    totalTax: 0,
    totalDiscount: 0
  });

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

      default:
        return { start: '', end: '' };
    }
  };

  // Calculate totals for display
  // Calculate totals from filtered orders
  // Total Value Logic:
  // - totalValue: Sum of order.total from ALL filtered orders (includes ALL statuses that match filter)
  // - totalTaxable: Sum of item.pricePerUnit only for items where item.tax > 0 
  // - totalTax: Sum of calculated tax amounts (tax percentage * taxable amount)
  // - totalDiscount: Sum of order.discount from ALL filtered orders
  const calculateTotals = (orders) => {
    console.log('🧮 calculateTotals called with', orders.length, 'orders');
    
    const totals = orders.reduce((acc, order) => {
      console.log(`Processing order ${order.ticketNumber}: total=${order.total}, tax=${order.tax}, discount=${order.discount}`);
      
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
      const totalTaxForOrder = orderTaxAmount + itemsTaxAmount;
      acc.totalTax += totalTaxForOrder;
      acc.totalTaxable += taxableAmount;
      
      console.log(`  Order tax amount: ${orderTaxAmount}, Items tax amount: ${itemsTaxAmount}, Total tax amount: ${totalTaxForOrder}, Taxable amount: ${taxableAmount}`);

      return acc;
    }, {
      totalValue: 0,
      totalTaxable: 0,
      totalTax: 0,
      totalDiscount: 0
    });

    console.log('🎯 Final calculated totals:', totals);
    setTotalsData(totals);
  };

  const fetchSaleOrders = async (page = 1, limit = itemsPerPage, appliedFilters = filters) => {
    try {
      setLoading(true);

      // Combine status filter and modify date fields based on status
      const combinedFilters = {
        ...appliedFilters,
        status: statusFilter === 'all' ? '' : statusFilter
      };

      // If status is 'paid', use paidDate for filtering instead of regular date
      if (statusFilter === 'paid' && (appliedFilters.from || appliedFilters.to)) {
        if (appliedFilters.from) {
          combinedFilters.paidFrom = appliedFilters.from;
          delete combinedFilters.from;
        }
        if (appliedFilters.to) {
          combinedFilters.paidTo = appliedFilters.to;
          delete combinedFilters.to;
        }
      }

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...Object.fromEntries(
          Object.entries(combinedFilters).filter(([_, value]) => value !== '')
        )
      });

      const apiUrl = `${import.meta.env.VITE_APIURL}/api/sale-orders?${queryParams}`;
      console.log('🔍 API Request URL:', apiUrl);
      console.log('📊 Applied Filters:', appliedFilters);
      console.log('🔧 Query Params:', Object.fromEntries(queryParams));

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      const result = await response.json();

      console.log('📥 API Response:', result);

      if (result.success) {
        setSaleOrders(result.data);
        setPagination(result.pagination);
        setCurrentPage(page);
        // Note: totals are calculated across ALL matching records (not just the current page).
        // We fetch totals separately via fetchTotals to avoid page-wise totals.
        console.log('✅ Orders fetched (page):', result.data.length);
      } else {
        setError('Failed to fetch sale orders');
      }
    } catch (err) {
      setError('Error fetching data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all matching orders (large limit) to calculate totals across all results
  const fetchTotals = async (appliedFilters = filters) => {
    try {
      // Combine status filter and modify date fields based on status
      const combinedFilters = {
        ...appliedFilters,
        status: statusFilter === 'all' ? '' : statusFilter
      };

      // If status is 'paid', use paidDate for filtering instead of regular date
      if (statusFilter === 'paid' && (appliedFilters.from || appliedFilters.to)) {
        if (appliedFilters.from) {
          combinedFilters.paidFrom = appliedFilters.from;
          delete combinedFilters.from;
        }
        if (appliedFilters.to) {
          combinedFilters.paidTo = appliedFilters.to;
          delete combinedFilters.to;
        }
      }

      const queryParams = new URLSearchParams({
        page: '1',
        limit: '1000', // fetch up to 1000 records for totals calculation
        ...Object.fromEntries(
          Object.entries(combinedFilters).filter(([_, value]) => value !== '')
        )
      });

      const apiUrl = `${import.meta.env.VITE_APIURL}/api/sale-orders?${queryParams}`;
      console.log('🔎 Fetching totals - API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      const result = await response.json();

      if (result.success) {
        // Calculate totals from all returned records
        console.log('🔎 fetchTotals API success - received data:', result.data);
        calculateTotals(result.data);
        console.log('✅ Totals calculated from', result.data.length, 'records');
      } else {
        console.log('❌ fetchTotals API failed:', result);
        // Reset totals on failure
        setTotalsData({ totalValue: 0, totalTaxable: 0, totalTax: 0, totalDiscount: 0 });
      }
    } catch (err) {
      console.error('Error fetching totals:', err);
      setTotalsData({ totalValue: 0, totalTaxable: 0, totalTax: 0, totalDiscount: 0 });
    }
  };

  const fetchTaxReport = async (type) => {
    try {
      setReportLoading(true);
      const endpoint = type === 'taxable' ? 'taxable' : 'non-taxable';

      // Build query parameters for report (fetch all data without pagination)
      const combinedFilters = {
        ...filters,
        status: statusFilter === 'all' ? '' : statusFilter
      };

      // If status is 'paid', use paidDate for filtering instead of regular date
      if (statusFilter === 'paid' && (filters.from || filters.to)) {
        if (filters.from) {
          combinedFilters.paidFrom = filters.from;
          delete combinedFilters.from;
        }
        if (filters.to) {
          combinedFilters.paidTo = filters.to;
          delete combinedFilters.to;
        }
      }

      const queryParams = new URLSearchParams({
        page: '1',
        limit: '1000', // Large limit to get all data
        ...Object.fromEntries(
          Object.entries(combinedFilters).filter(([_, value]) => value !== '')
        )
      });

      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/sale-orders/${endpoint}?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      const result = await response.json();

      if (result.success) {
        setReportData(result.data);
        setReportType(type);
        setShowReportModal(true);
        // Calculate totals for report data
        calculateTotals(result.data);
      } else {
        setError(`Failed to fetch ${type} report`);
      }
    } catch (err) {
      setError(`Error fetching ${type} report: ` + err.message);
    } finally {
      setReportLoading(false);
    }
  };

  const generatePDF = () => {
    const printContent = document.getElementById('report-content');
    const originalContent = document.body.innerHTML;

    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Reload to restore React functionality
  };

  // Calculate GST amount for an order
  const calculateGSTAmount = (order) => {
    // GST from order level - treat as percentage and calculate amount
    let orderGSTAmount = 0;
    if (order.tax && order.tax > 0) {
      // Calculate subtotal from items base prices
      const orderSubtotal = order.items?.reduce((sum, item) => {
        return sum + ((item.pricePerUnit || 0) * (item.quantity || 1));
      }, 0) || 0;
      orderGSTAmount = (orderSubtotal * (order.tax / 100));
    }
    
    // GST from items level - calculate tax amount from percentage
    const itemsGSTAmount = order.items?.reduce((sum, item) => {
      const itemTaxPercent = item.tax || 0;
      const itemQuantity = item.quantity || 1;
      const itemBasePrice = (item.pricePerUnit || 0) * itemQuantity;
      
      if (itemTaxPercent > 0) {
        const itemTaxAmount = (itemBasePrice * (itemTaxPercent / 100));
        return sum + itemTaxAmount;
      }
      return sum;
    }, 0) || 0;
    
    // Return total GST amount
    return orderGSTAmount + itemsGSTAmount;
  };

  const calculateReportTotals = () => {
    const totals = reportData.reduce((acc, order) => {
      acc.totalAmount += order.total || 0;
      
      // Calculate discount amount from percentage (applied to total amount including tax)
      let orderDiscountAmount = 0;
      if (order.discount && order.discount > 0) {
        const orderSubtotal = order.items?.reduce((sum, item) => {
          return sum + ((item.pricePerUnit || 0) * (item.quantity || 1));
        }, 0) || 0;
        
        // Calculate tax amount first
        let orderTaxAmount = 0;
        if (order.tax && order.tax > 0) {
          orderTaxAmount = (orderSubtotal * (order.tax / 100));
        }
        
        // Apply discount to total amount (subtotal + tax)
        const totalBeforeDiscount = orderSubtotal + orderTaxAmount;
        orderDiscountAmount = (totalBeforeDiscount * (order.discount / 100));
      }
      acc.totalDiscount += orderDiscountAmount;
      
      // Calculate tax amount from percentage (not store percentage directly)
      let orderTaxAmount = 0;
      if (order.tax && order.tax > 0) {
        const orderSubtotal = order.items?.reduce((sum, item) => {
          return sum + ((item.pricePerUnit || 0) * (item.quantity || 1));
        }, 0) || 0;
        orderTaxAmount = (orderSubtotal * (order.tax / 100));
      }
      acc.totalTax += orderTaxAmount;
      acc.orderCount += 1;

      // Calculate items tax amount from percentage
      order.items?.forEach(item => {
        const itemTaxPercent = item.tax || 0;
        const itemQuantity = item.quantity || 1;
        const itemBasePrice = (item.pricePerUnit || 0) * itemQuantity;
        
        if (itemTaxPercent > 0) {
          const itemTaxAmount = (itemBasePrice * (itemTaxPercent / 100));
          acc.totalItemsTax += itemTaxAmount;
        }
      });

      // Calculate total GST amount (already calculated properly in calculateGSTAmount)
      acc.totalGST += calculateGSTAmount(order);

      return acc;
    }, {
      totalAmount: 0,
      totalDiscount: 0,
      totalTax: 0,
      totalItemsTax: 0,
      totalGST: 0,
      orderCount: 0
    });

    return totals;
  };

  // Handle date filter change
  const handleDateFilterChange = (filter) => {
    setDateFilter(filter);
    if (filter !== 'custom') {
      const range = getDateRange(filter);
      setFilters(prev => ({
        ...prev,
        from: range.start,
        to: range.end
      }));
    }
    setCurrentPage(1);
    // Will trigger fetch in useEffect when dateFilter changes
  };

  // Handle custom date changes
  const handleFromDateChange = (date) => {
    handleFilterChange('from', date);
    setDateFilter('custom');
    setCurrentPage(1);
  };

  const handleToDateChange = (date) => {
    handleFilterChange('to', date);
    setDateFilter('custom');
    setCurrentPage(1);
  };

  useEffect(() => {
    // Initialize default date range to today for paid status
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    setFilters(prev => ({
      ...prev,
      from: todayStr,
      to: todayStr
    }));
  }, []);

  useEffect(() => {
    // Only fetch if we have dates set
    if (filters.from && filters.to) {
      const combinedFilters = {
        ...filters,
        status: statusFilter === 'all' ? '' : statusFilter
      };
      fetchSaleOrders(1, itemsPerPage, combinedFilters);
      // Fetch totals across all matching records
      fetchTotals(combinedFilters);
    }
  }, [itemsPerPage, filters.from, filters.to, statusFilter]);

  // Fetch data when date filter changes (non-custom filters)
  useEffect(() => {
    if (dateFilter !== 'custom' && filters.from && filters.to) {
      const combinedFilters = {
        ...filters,
        status: statusFilter === 'all' ? '' : statusFilter
      };
      fetchSaleOrders(1, itemsPerPage, combinedFilters);
      fetchTotals(combinedFilters);
    }
  }, [dateFilter]);

  // Fetch data when custom dates change (with debounce for better performance)
  useEffect(() => {
    if (dateFilter === 'custom' && filters.from && filters.to) {
      const timeoutId = setTimeout(() => {
        const combinedFilters = {
          ...filters,
          status: statusFilter === 'all' ? '' : statusFilter
        };
        fetchSaleOrders(1, itemsPerPage, combinedFilters);
        fetchTotals(combinedFilters);
      }, 500); // 500ms debounce
      
      return () => clearTimeout(timeoutId);
    }
  }, [filters.from, filters.to]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      const combinedFilters = {
        ...filters,
        status: statusFilter === 'all' ? '' : statusFilter
      };
      fetchSaleOrders(page, itemsPerPage, combinedFilters);
    }
  };

  const handleItemsPerPageChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  // Handle order row click to show details
  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  const applyFilters = () => {
    // Combine date filters and status filter
    const combinedFilters = {
      ...filters,
      status: statusFilter === 'all' ? '' : statusFilter
    };
    console.log('🎯 Applying Filters:');
    console.log('  - Date Filters:', filters);
    console.log('  - Status Filter:', statusFilter);
    console.log('  - Combined Filters:', combinedFilters);
    
    setCurrentPage(1);
    fetchSaleOrders(1, itemsPerPage, combinedFilters);
    // Also fetch totals across all matching records (not just page)
    fetchTotals(combinedFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      status: '',
      from: '',
      to: ''
    };
    setFilters(clearedFilters);
    setStatusFilter('all');
    setDateFilter('thisMonth');
    // Reset to current month
    const { start, end } = getDateRange('thisMonth');
    setFilters(prev => ({
      ...clearedFilters,
      from: start,
      to: end
    }));
    setCurrentPage(1);
    fetchSaleOrders(1, itemsPerPage, clearedFilters);
    // Update totals as well
    const totalsFilters = {
      ...clearedFilters,
      from: getDateRange('thisMonth').start,
      to: getDateRange('thisMonth').end
    };
    fetchTotals(totalsFilters);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'new':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'prediagnosed':
        return 'bg-purple-100 text-purple-800';
      case 'converttosale':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'paid':
        return 'bg-emerald-100 text-emerald-800';
      case 'deleted':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const generatePageNumbers = () => {
    const pages = [];
    const totalPages = pagination.totalPages;
    const current = currentPage;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (current > 4) {
        pages.push('...');
      }

      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < totalPages - 3) {
        pages.push('...');
      }

      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Loading repair history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  const updateOrderStatus = async () => {
    try {
      setUpdateLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_APIURL}/api/sale-orders/${editingOrder._id}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const result = await response.json();

      if (result.success) {
        // Refresh list
        const combinedFilters = {
          ...filters,
          status: statusFilter === 'all' ? '' : statusFilter
        };

        fetchSaleOrders(currentPage, itemsPerPage, combinedFilters);
        fetchTotals(combinedFilters);

        setShowEditModal(false);
        setEditingOrder(null);
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      alert('Error updating status');
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Repair History</h1>
          <div className="flex items-center mt-2 text-sm text-gray-600">
            <span className="mr-2">📅 Filter:</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
              {dateFilter === 'custom' ? 'Custom Range' : 
               dateFilter === 'today' ? 'Today' :
               dateFilter === 'yesterday' ? 'Yesterday' :
               dateFilter === 'weekly' ? 'Last 7 Days' :
               dateFilter === 'thisMonth' ? 'This Month' :
               dateFilter === 'previousMonth' ? 'Previous Month' :
               dateFilter === 'quarterly' ? 'Quarterly' :
               dateFilter === 'halfYear' ? 'Half Year' :
               dateFilter === 'financialYear' ? 'Financial Year' : 'Unknown'}
            </span>
            <span className="mx-2">•</span>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
              Status: {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
            </span>
            {filters.from && filters.to && (
              <span className="ml-2 text-gray-500">
                ({filters.from} to {filters.to})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Report Generation Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => fetchTaxReport('taxable')}
              disabled={reportLoading}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            >
              {reportLoading ? 'Loading...' : 'Generate Taxable Report'}
            </button>
            <button
              onClick={() => fetchTaxReport('non-taxable')}
              disabled={reportLoading}
              className="px-4 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
            >
              {reportLoading ? 'Loading...' : 'Generate Non-Taxable Report'}
            </button>
          </div>

          {/* Items per page selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Show:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-gray-600">per page</span>
          </div>
        </div>

        {/* Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-xl font-bold text-gray-800">
                  {reportType === 'taxable' ? 'Taxable Orders Report' : 'Non-Taxable Orders Report'}
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={generatePDF}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Download PDF
                  </button>
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div id="report-content">
                  {/* Report Header */}
                  <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                      {reportType === 'taxable' ? 'Taxable Orders Report' : 'Non-Taxable Orders Report'}
                    </h1>
                    <p className="text-gray-600">Generated on {formatDate(new Date())}</p>
                    {(filters.from || filters.to) && (
                      <p className="text-gray-600">
                        Period: {filters.from ? formatDate(filters.from) : 'Start'} - {filters.to ? formatDate(filters.to) : 'End'}
                      </p>
                    )}
                  </div>

                  {/* Report Summary */}
                  <div className="mb-6 bg-gray-50 p-4 rounded">
                    <h3 className="font-semibold mb-2">Report Summary</h3>
                    {(() => {
                      const totals = calculateReportTotals();
                      return (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Total Orders:</span> {totals.orderCount}
                          </div>
                          <div>
                            <span className="font-medium">Total Amount:</span> ₹{(totals.totalAmount || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Report Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Ticket #</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Customer</th>
                          {reportType === 'taxable' ? <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">GST Number</th> : ""}
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Status</th>
                          {reportType === 'taxable' ? <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Items Tax</th> : ""}
                          {reportType === 'taxable' ? <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">GST Amount</th> : ""}
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.map((order) => (
                          <tr key={order._id}>
                            <td className="px-4 py-2 text-sm border">{order.ticketNumber}</td>
                            <td className="px-4 py-2 text-sm border">
                              <div>{order.customerName}</div>
                              <div className="text-xs text-gray-500">{order.phone}</div>
                            </td>
                            {reportType === 'taxable' ?
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                               {order?.gstNumber}
                              </td>
                              : ""}
                            <td className="px-4 py-2 text-sm border">{formatDate(order.date)}</td>
                            <td className="px-4 py-2 text-sm border">
                              <span className={`px-2 py-1 text-xs rounded ${getStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                            </td>
                            {reportType === 'taxable' ?
                              <td className="px-4 py-2 text-sm border">
                                {(order.items?.reduce((sum, item) => sum + ((item.tax || 0) * (item.quantity || 1)), 0) || 0).toLocaleString('en-IN')} %
                              </td>
                              : ""}
                            {reportType === 'taxable' ?
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ₹{(calculateGSTAmount(order) || 0).toLocaleString('en-IN')}
                              </td>
                              : ""}
                            <td className="px-4 py-2 text-sm font-medium border">₹{(order.total || 0).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {reportData.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No {reportType} orders found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Filter</label>
            <select
              value={dateFilter}
              onChange={(e) => handleDateFilterChange(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="custom">Custom Range</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="weekly">Last 7 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="previousMonth">Previous Month</option>
              <option value="quarterly">Quarterly</option>
              <option value="halfYear">Half Year</option>
              <option value="financialYear">Financial Year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              {/* <option value="preDiagnosed">Pre-Diagnosed</option> */}
              {/* <option value="ConvertToSale">Convert to Sale</option> */}
              <option value="Completed">Completed</option>
              <option value="Paid">Paid</option>
            </select>
          </div>

          <div className={`${dateFilter === 'custom' ? 'block' : 'hidden'}`}>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => handleFromDateChange(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className={`${dateFilter === 'custom' ? 'block' : 'hidden'}`}>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => handleToDateChange(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {dateFilter !== 'custom' && (
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Selected Date Range</label>
              <div className="p-2 bg-blue-50 rounded border border-blue-200">
                <span className="text-blue-800 font-medium">
                  {filters.from} to {filters.to}
                </span>
                {loading && (
                  <span className="ml-2 text-blue-600 text-sm">
                    🔄 Loading...
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-end space-x-2">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Apply
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Total Display Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 mb-4 bg-gray-100 rounded">
        <div className="bg-white p-4 rounded shadow text-center">
          <div className="text-gray-600 text-sm">Total Value</div>
          <div className="text-2xl font-bold text-blue-600">₹{totalsData.totalValue.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white p-4 rounded shadow text-center">
          <div className="text-gray-600 text-sm">Total Taxable</div>
          <div className="text-2xl font-bold text-green-600">₹{totalsData.totalTaxable.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white p-4 rounded shadow text-center">
          <div className="text-gray-600 text-sm">Total Tax</div>
          <div className="text-2xl font-bold text-orange-600">₹{totalsData.totalTax.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white p-4 rounded shadow text-center">
          <div className="text-gray-600 text-sm">Total Discount</div>
          <div className="text-2xl font-bold text-red-600">₹{totalsData.totalDiscount.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Pagination info */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, pagination.totalCount)} of {pagination.totalCount} records
      </div>

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
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Technician
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {saleOrders.map((order) => (
                <tr 
                  key={order._id} 
                  className="hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                  onClick={() => handleOrderClick(order)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {order.ticketNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.customerName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      S/N: {order.serialNumber}
                    </div>
                    <div className="text-sm text-gray-500">
                      IMEI: {order.imeiNumber}
                    </div>
                    <div className="text-sm text-gray-500">
                      Color: {order.color}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(order.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.technicianName}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {order.preDiagnosed}
                    </div>
                    {order.assetsReceived && (
                      <div className="text-xs text-gray-500 mt-1">
                        Assets: {order.assetsReceived}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status || 'pending')}`}>
                      {(order.status || 'pending').charAt(0).toUpperCase() + (order.status || 'pending').slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ₹{(order.total || 0).toLocaleString('en-IN')}
                    </div>
                    {(order.discount || 0) > 0 && (
                      <div className="text-xs text-green-600">
                        Discount: {order.discount}% (₹{(() => {
                          // Calculate discount amount from percentage (applied to total amount including tax)
                          const itemsSubtotal = order.items?.reduce((sum, item) => {
                            return sum + ((item.pricePerUnit || 0) * (item.quantity || 1));
                          }, 0) || 0;
                          
                          // Calculate tax amount
                          const taxAmount = calculateGSTAmount(order);
                          
                          // Apply discount to total amount (subtotal + tax)
                          const totalBeforeDiscount = itemsSubtotal + taxAmount;
                          const discountAmount = (totalBeforeDiscount * (order.discount / 100));
                          return discountAmount.toLocaleString('en-IN');
                        })()})
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.paymentType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex flex-col space-y-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // prevent row click
                          setEditingOrder(order);
                          setNewStatus(order.status);
                          setShowEditModal(true);
                        }}
                        className="px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
                      >
                        Edit Status
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setUpdatingOrder(order);
                          setShowUpdateModal(true);
                        }}
                        className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                      >
                        Update
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {saleOrders.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No repair records found
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          {/* Previous button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-2 rounded-md text-sm font-medium ${currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
          >
            Previous
          </button>

          {/* Page numbers */}
          {generatePageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-gray-500">...</span>
              ) : (
                <button
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}

          {/* Next button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pagination.totalPages}
            className={`px-3 py-2 rounded-md text-sm font-medium ${currentPage === pagination.totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
          >
            Next
          </button>
        </div>
      )}

      {/* Page info at bottom */}
      {pagination.totalCount > 0 && (
        <div className="mt-4 text-center text-sm text-gray-600">
          Page {currentPage} of {pagination.totalPages} • Total {pagination.totalCount} records
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Order Details - {selectedOrder.ticketNumber}
              </h2>
              <button
                onClick={closeOrderModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Customer Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Name:</span> {selectedOrder.customerName}</p>
                    <p><span className="font-medium">Phone:</span> {selectedOrder.phone}</p>
                    {selectedOrder.alternatePhone && (
                      <p><span className="font-medium">Alternate Phone:</span> {selectedOrder.alternatePhone}</p>
                    )}
                    {selectedOrder.address && (
                      <p><span className="font-medium">Address:</span> {selectedOrder.address}</p>
                    )}
                    {selectedOrder.gstNumber && (
                      <p><span className="font-medium">GST Number:</span> {selectedOrder.gstNumber}</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Order Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Ticket Number:</span> {selectedOrder.ticketNumber}</p>
                    <p><span className="font-medium">Date:</span> {formatDate(selectedOrder.date)}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 text-xs rounded ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </p>
                    {selectedOrder.technicianName && (
                      <p><span className="font-medium">Technician:</span> {selectedOrder.technicianName}</p>
                    )}
                    {selectedOrder.paymentType && (
                      <p><span className="font-medium">Payment Type:</span> {selectedOrder.paymentType}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Device Information */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Device Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    {selectedOrder.serialNumber && (
                      <p><span className="font-medium">Serial Number:</span> {selectedOrder.serialNumber}</p>
                    )}
                    {selectedOrder.imeiNumber && (
                      <p><span className="font-medium">IMEI Number:</span> {selectedOrder.imeiNumber}</p>
                    )}
                    {selectedOrder.color && (
                      <p><span className="font-medium">Color:</span> {selectedOrder.color}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    {selectedOrder.deviceBrand?.name && (
                      <p><span className="font-medium">Brand:</span> {selectedOrder.deviceBrand.name}</p>
                    )}
                    {selectedOrder.model?.name && (
                      <p><span className="font-medium">Model:</span> {selectedOrder.model.name}</p>
                    )}
                    {selectedOrder.assetsReceived && (
                      <p><span className="font-medium">Assets Received:</span> {selectedOrder.assetsReceived}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Items/Tasks and Services */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="mb-6">
                  {/* Items Summary Table */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">📋 Summary Table</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">#</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Description</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Qty</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Unit Price</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Tax</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedOrder.items.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm border font-medium">{index + 1}</td>
                              <td className="px-4 py-2 text-sm border">
                                <div>
                                  {item.description || item.issue || 'N/A'}
                                  {item.serialNumber && (
                                    <div className="text-xs text-gray-500">S/N: {item.serialNumber}</div>
                                  )}
                                  {item.warranty && (
                                    <div className="text-xs text-green-600">🛡️ {item.warranty}</div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2 text-sm border">{item.quantity || 1} {item.unit || 'pcs'}</td>
                              <td className="px-4 py-2 text-sm border">₹{(item.pricePerUnit || 0).toLocaleString('en-IN')}</td>
                              <td className="px-4 py-2 text-sm border">{(item.tax || 0)}%</td>
                              <td className="px-4 py-2 text-sm border font-medium">₹{(item.amount || 0).toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Totals */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Order Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Subtotal</div>
                    <div className="text-lg font-semibold">
                      ₹{(() => {
                        // Calculate subtotal from total of all item amounts
                        const itemsSubtotal = selectedOrder.items?.reduce((sum, item) => {
                          return sum + (item.amount || 0);
                        }, 0) || 0;
                        return itemsSubtotal.toLocaleString('en-IN');
                      })()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Discount</div>
                    <div className="text-lg font-semibold text-red-600">
                      {selectedOrder.discount && selectedOrder.discount > 0 ? (
                        <div>
                          <div>{selectedOrder.discount}%</div>
                          <div className="text-sm">
                            -₹{(() => {
                              // Calculate discount amount from percentage (applied to total amount including tax)
                              const itemsSubtotal = selectedOrder.items?.reduce((sum, item) => {
                                return sum + ((item.pricePerUnit || 0) * (item.quantity || 1));
                              }, 0) || 0;
                              
                              // Calculate tax amount
                              const taxAmount = calculateGSTAmount(selectedOrder);
                              
                              // Apply discount to total amount (subtotal + tax)
                              const totalBeforeDiscount = itemsSubtotal + taxAmount;
                              const discountAmount = (totalBeforeDiscount * (selectedOrder.discount / 100));
                              return discountAmount.toLocaleString('en-IN');
                            })()}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div>0%</div>
                          <div className="text-sm">-₹0</div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Tax</div>
                    <div className="text-lg font-semibold text-orange-600">
                      ₹{(() => {
                        // Calculate tax amount using the same logic as calculateGSTAmount
                        return calculateGSTAmount(selectedOrder).toLocaleString('en-IN');
                      })()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Total</div>
                    <div className="text-xl font-bold text-blue-600">
                      ₹{(selectedOrder.total || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              {(selectedOrder.completedAt || selectedOrder.paidAt) && (
                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">📅 Timeline</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Created:</span> {formatDate(selectedOrder.createdAt)}</p>
                    {selectedOrder.completedAt && (
                      <p><span className="font-medium">Completed:</span> {formatDate(selectedOrder.completedAt)}</p>
                    )}
                    {selectedOrder.paidAt && (
                      <p><span className="font-medium">Paid:</span> {formatDate(selectedOrder.paidAt)}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Return Information */}
              {selectedOrder.returns && selectedOrder.returns.length > 0 && (
                <div className="mt-6 bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                  <h3 className="text-lg font-medium text-red-900 mb-3">🔄 Return History</h3>
                  <div className="space-y-3">
                    {selectedOrder.returnCount && (
                      <p className="text-red-800">
                        <span className="font-medium">Total Returns:</span> {selectedOrder.returnCount}
                      </p>
                    )}
                    {selectedOrder.returns.map((returnInfo, index) => (
                      <div key={index} className="bg-white p-3 rounded border border-red-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-sm">
                              <span className="font-medium text-red-800">Return Date:</span>
                              <span className="ml-2">{formatDate(returnInfo.returnedAt)}</span>
                            </p>
                            {returnInfo.returnReason && (
                              <p className="text-sm">
                                <span className="font-medium text-red-800">Reason:</span>
                                <span className="ml-2">{returnInfo.returnReason}</span>
                              </p>
                            )}
                          </div>
                          <div>
                            {returnInfo.returnHandledBy && (
                              <p className="text-sm">
                                <span className="font-medium text-red-800">Handled By:</span>
                                <span className="ml-2">{returnInfo.returnHandledBy}</span>
                              </p>
                            )}
                            {returnInfo.returnNote && (
                              <p className="text-sm">
                                <span className="font-medium text-red-800">Note:</span>
                                <span className="ml-2">{returnInfo.returnNote}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={closeOrderModal}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {showEditModal && editingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">
              Edit Status - {editingOrder.ticketNumber}
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Select Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="open">Open</option>
                <option value="new">New</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="paid">Paid</option>
                <option value="deleted">Deleted</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={updateOrderStatus}
                disabled={updateLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {updateLoading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Update Modal */}
      {showUpdateModal && updatingOrder && (
        <AdminUpdateOrderModal
          order={updatingOrder}
          onClose={() => { setShowUpdateModal(false); setUpdatingOrder(null); }}
          onUpdated={(log) => {
            setShowUpdateModal(false);
            setUpdatingOrder(null);
            setChangesLog(log);
            // Refresh the list
            const combinedFilters = {
              ...filters,
              status: statusFilter === 'all' ? '' : statusFilter,
            };
            fetchSaleOrders(currentPage, itemsPerPage, combinedFilters);
            fetchTotals(combinedFilters);
          }}
        />
      )}

      {/* Changes Log notification */}
      {changesLog && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-md bg-white border border-green-400 rounded-xl shadow-2xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-base font-bold text-green-700">✅ Order Updated</p>
              <p className="text-sm text-gray-600 mt-0.5">
                Ticket: <span className="font-semibold text-blue-600">{changesLog.ticketNumber}</span>
                &nbsp;·&nbsp;
                <span className="text-gray-400 text-xs">{new Date(changesLog.timestamp).toLocaleString('en-IN')}</span>
              </p>
            </div>
            <button
              onClick={() => setChangesLog(null)}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none"
            >
              ×
            </button>
          </div>

          {Object.keys(changesLog.changes).length === 0 ? (
            <p className="text-sm text-gray-500 italic">No fields were changed.</p>
          ) : (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">What changed:</p>
              <ul className="space-y-1 max-h-48 overflow-y-auto">
                {Object.entries(changesLog.changes).map(([field, diff]) => (
                  <li key={field} className="text-xs flex items-start space-x-1">
                    <span className="font-semibold text-gray-700 w-28 flex-shrink-0">{field}:</span>
                    <span className="text-red-500 line-through mr-1">
                      {typeof diff.from === 'object' ? JSON.stringify(diff.from) : String(diff.from ?? '—')}
                    </span>
                    <span className="text-gray-400 mr-1">→</span>
                    <span className="text-green-700 font-medium">
                      {typeof diff.to === 'object' ? JSON.stringify(diff.to) : String(diff.to ?? '—')}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-400 mt-2 italic">
                All changes have been logged to the audit history.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RepairHistory;