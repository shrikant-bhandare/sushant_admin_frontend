import React, { useState, useEffect, useRef } from 'react';
import FilterBar from '../components/invoice/FilterBar';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import InvoiceTable from '../components/invoice/InvoiceTable';
import useLoader from '../customHooks/useLoader'; // Import the useLoader hook
import { FaPlus, FaFileInvoice, FaSearch, FaFilter, FaChartLine } from 'react-icons/fa';

const SalesOrders = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [currentFilters, setCurrentFilters] = useState({}); // Store current filters
  const [activeTab, setActiveTab] = useState('all'); // Tab state for filtering
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    new: 0,
    inprogress: 0,
    completed: 0,
    paid: 0
  }); // Tab counts for each status
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    totalRecords: 0,
  });
  const [isLoading, setIsLoading] = useState(false); // Track loading state separately
  const isInitialLoad = useRef(true); // Track if this is the initial load

  const { Loader, showLoader, hideLoader } = useLoader(); // Destructure loader functions

  const handleCreateInvoice = () => {
    navigate('/receptionist/saleorders/new'); // Navigate to the new invoice page
    console.log('Create new invoice');
  };
  const fetchTabCounts = async () => {
    try {
      // Fetch counts for each status separately to get accurate totals
      const statusesToCount = [
        { key: 'all', status: null },
        { key: 'new', status: ['New'] },
        { key: 'inprogress', status: ['In Progress'] },
        { key: 'completed', status: ['Completed'] },
        { key: 'paid', status: ['Paid'] }
      ];

      const countPromises = statusesToCount.map(async ({ key, status }) => {
        const payload = {
          page: 1,
          pageSize: 1, // We only need the count, not the data
          showDeleted: false
        };
        
        if (status) {
          payload.status = status;
        }

        const response = await fetch(`${import.meta.env.VITE_APIURL}/api/sale-orders/filter`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        return { key, count: data.success ? data.pagination.totalRecords : 0 };
      });

      const results = await Promise.all(countPromises);
      
      const newCounts = {};
      results.forEach(({ key, count }) => {
        newCounts[key] = count;
      });

      setTabCounts(newCounts);
    } catch (error) {
      console.error('Error fetching tab counts:', error);
    }
  };

  const handleFilter = async (filters = {}, page = 1, pageSize = 10, tabFilter = activeTab, showLoaderFlag = false) => {
    // Only show loader on initial load or if explicitly requested
    if (showLoaderFlag) {
      showLoader();
    }
    
    setIsLoading(true); // Track local loading state
    
    // Store current filters for pagination
    if (Object.keys(filters).length > 0) {
      setCurrentFilters(filters);
    }
    
    try {
      // Use stored filters if no new filters provided (for pagination)
      const filtersToUse = Object.keys(filters).length > 0 ? filters : currentFilters;
      
      // Prepare the filter payload
      const filterPayload = { 
        ...filtersToUse, 
        page, 
        pageSize,
        showDeleted: filtersToUse.showDeleted || false,
      };

      // Add tab-based status filtering
      if (tabFilter === 'paid') {
        filterPayload.status = ['Paid'];
      } else if (tabFilter === 'completed') {
        filterPayload.status = ['Completed'];
      } else if (tabFilter === 'inprogress') {
        filterPayload.status = ['In Progress'];
      } else if (tabFilter === 'new') {
        filterPayload.status = ['New'];
      }
      // 'all' tab doesn't add any status filter

      // Only include additional status filter if specific statuses are selected from FilterBar
      if (filtersToUse.status && filtersToUse.status.length > 0 && tabFilter === 'all') {
        filterPayload.status = filtersToUse.status;
      }

      console.log('Sending filter payload:', filterPayload);

      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/sale-orders/filter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(filterPayload),
      });
      const data = await response.json();
      
      console.log('Response data:', data);
      
      if (data.success) {
        setFilteredInvoices(data.data);
        setPagination({
          currentPage: data.pagination.currentPage,
          pageSize: data.pagination.pageSize,
          totalPages: data.pagination.totalPages,
          totalRecords: data.pagination.totalRecords,
        });
        
        // Update tab counts only when viewing 'all' tab (unfiltered data)
        // This ensures counts don't get overwritten by filtered data
        if (page === 1) {
          // Fetch accurate counts separately
          fetchTabCounts();
        }
      } else {
        console.error('Failed to fetch filtered data:', data.message);
      }
    } catch (error) {
      console.error('Error fetching filtered data:', error);
    } finally {
      setIsLoading(false); // Stop loading
      if (showLoaderFlag) {
        hideLoader();
      }
    }
  };

  useEffect(() => {
    // Only show loader on initial load
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      handleFilter({}, 1, 10, 'all', true); // Show loader only on initial load
    }
  }, []);

  const handlePageChange = (newPage) => {
    console.log('Page change to:', newPage, 'with current filters:', currentFilters);
    handleFilter({}, newPage, pagination.pageSize, activeTab, false); // No loader for pagination
  };

  const handlePageSizeChange = (newPageSize) => {
    console.log('Page size change to:', newPageSize, 'with current filters:', currentFilters);
    handleFilter({}, 1, newPageSize, activeTab, false); // No loader for page size change
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    handleFilter({}, 1, pagination.pageSize, tab, false); // No loader for tab change - seamless UX
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <Loader /> {/* Render the loader */}
      
      {/* Modern Header */}
      <div className={`sticky top-0 z-10 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-b shadow-sm`}>
        <div className="w-full px-4 sm:px-6">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDarkMode ? "bg-purple-600" : "bg-purple-100"}`}>
                <FaFileInvoice className={`text-lg ${isDarkMode ? "text-white" : "text-purple-600"}`} />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Service Orders
                </h1>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Manage and track all service orders efficiently
                </p>
              </div>
            </div>
            
            <button
              onClick={handleCreateInvoice}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <FaPlus className="mr-2" size={14} />
              Create Service Order
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 py-6">
        {/* Tab Navigation */}
        <div className={`mb-6 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-lg shadow border`}>
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              Filter by Status
            </h3>
          </div>
          <div className="p-2">
            <nav className="flex space-x-1" aria-label="Tabs">
              {[
                { id: 'all', label: 'All Orders', count: tabCounts.all },
                { id: 'new', label: 'New', count: tabCounts.new },
                { id: 'inprogress', label: 'In Progress', count: tabCounts.inprogress },
                { id: 'completed', label: 'Completed', count: tabCounts.completed },
                { id: 'paid', label: 'Paid', count: tabCounts.paid }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? `${isDarkMode 
                          ? "bg-purple-600 text-white" 
                          : "bg-purple-100 text-purple-700"} border-purple-500`
                      : `${isDarkMode 
                          ? "text-gray-400 hover:text-white hover:bg-gray-700" 
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"} border-transparent`
                  } whitespace-nowrap py-2 px-3 border-b-2 font-medium text-sm transition-colors duration-200 rounded-t-md`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      activeTab === tab.id 
                        ? `${isDarkMode ? "bg-purple-800 text-purple-100" : "bg-purple-200 text-purple-800"}`
                        : `${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Stats Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-lg shadow border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Total Orders
                </p>
                <p className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {pagination.totalRecords}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaFileInvoice className="text-blue-600 text-lg" />
              </div>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg shadow border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Active Orders
                </p>
                <p className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {filteredInvoices.filter(invoice => invoice.status === 'open').length}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <FaChartLine className="text-green-600 text-lg" />
              </div>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg shadow border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Completed
                </p>
                <p className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {filteredInvoices.filter(invoice => invoice.status === 'Completed').length}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <FaFileInvoice className="text-purple-600 text-lg" />
              </div>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg shadow border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  This Month
                </p>
                <p className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {filteredInvoices.filter(invoice => {
                    const invoiceDate = new Date(invoice.date);
                    const currentDate = new Date();
                    return invoiceDate.getMonth() === currentDate.getMonth() && 
                           invoiceDate.getFullYear() === currentDate.getFullYear();
                  }).length}
                </p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <FaSearch className="text-orange-600 text-lg" />
              </div>
            </div>
          </div>
        </div> */}

        {/* Filter Section */}
        {/* <div className={`mb-6 p-4 rounded-lg shadow border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}> */}
          {/* <div className="flex items-center gap-2 mb-3">
            <FaFilter className={`text-base ${isDarkMode ? "text-purple-400" : "text-purple-600"}`} />
            <h3 className={`text-base font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Filter & Search
            </h3>
          </div> */}
          <FilterBar onFilter={(filters) => handleFilter(filters, 1, pagination.pageSize, activeTab)} />
        {/* </div> */}

        {/* Table Section */}
        <div className={`rounded-lg shadow border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} overflow-hidden`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className={`text-base font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Service Orders List
            </h3>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"} mt-1`}>
              Showing {pagination.totalRecords} total orders
            </p>
          </div>
          <InvoiceTable
            invoices={filteredInvoices}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onRefresh={() => handleFilter({}, 1, pagination.pageSize, activeTab)}
          />
        </div>
      </div>
    </div>
  );
};

export default SalesOrders;


