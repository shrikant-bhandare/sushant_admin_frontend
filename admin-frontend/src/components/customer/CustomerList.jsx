import React, { useState, useEffect } from "react";
import { FaArrowLeft, FaArrowRight, FaPlus, FaSearch, FaUser, FaPhone, FaEnvelope, FaDesktop, FaFilter, FaSort, FaEye, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext";
import CustomerProfile from "../../customer/CustomerProfile"; // Import the CustomerProfile component

const CustomerList = () => {
  const { isDarkMode } = useTheme();
  const [customers, setCustomers] = useState([]);
  const [reloadData, setReloadData] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    totalRecords: 0,
  });
  const [filters, setFilters] = useState({ name: "", phoneNumber: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCustomerForm, setShowCustomerForm] = useState(false); // State to toggle customer form
  const [showViewModal, setShowViewModal] = useState(false); // State for view modal
  const [showEditModal, setShowEditModal] = useState(false); // State for edit modal
  const [selectedCustomer, setSelectedCustomer] = useState(null); // Selected customer for view/edit

  useEffect(() => {
    console.log("Fetching customers with filters:");
    fetchCustomers(pagination.currentPage, pagination.pageSize, filters);
  }, [pagination.currentPage, pagination.pageSize, filters,reloadData]);

  const fetchCustomers = async (page, size, filters) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APIURL}/api/customers/list?page=${page}&pageSize=${size}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem('accessToken')}` },
          body: JSON.stringify(filters),
        }
      );
      const data = await response.json();
      if (data.statusCode === 200 && data?.data) {
        setCustomers(data?.data);
        setPagination({
          currentPage: data.pagination.currentPage,
          pageSize: data.pagination.pageSize,
          totalPages: data.pagination.totalPages,
          totalRecords: data.pagination.totalRecords,
        });
      } else {
        setError(data.message || "Failed to fetch customers.");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (pagination.currentPage > 1) {
      setPagination((prev) => ({ ...prev, currentPage: (parseInt(prev.currentPage) - 1) }));
    }
  };

  const handleNext = () => {
    if (pagination.currentPage < pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: (parseInt(prev.currentPage) + 1) }));
    }
  };

  const handlePageSizeChange = (event) => {
    setPagination((prev) => ({
      ...prev,
      pageSize: Number(event.target.value),
      currentPage: 1,
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };


  const handleAddCustomer = () => {
    setShowCustomerForm(true); // Show the customer profile form
  };

  const handleCloseCustomerForm = () => {
    setShowCustomerForm(false); // Close the customer profile form
  };

  const handleViewCustomer = (customer) => {
    console.log('Customer device data:', customer.devices); // Debug log
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowEditModal(true);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedCustomer(null);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedCustomer(null);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const sortedCustomers = [...customers].sort((a, b) => {
    let aValue = a[sortBy] || '';
    let bValue = b[sortBy] || '';
    
    if (sortBy === 'name') {
      aValue = a.name || '';
      bValue = b.name || '';
    }
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return (
    <div className={`min-h-screen p-4 sm:p-6 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
      {/* Modern Header */}
      <div className={`mb-8 p-6 rounded-2xl ${isDarkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-700' : 'bg-gradient-to-r from-white to-gray-50 border border-gray-200'} shadow-xl`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Customer Management
            </h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage and view all your customers in one place ({pagination.totalRecords} total customers)
            </p>
          </div>
          <button
            onClick={handleAddCustomer}
            className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <FaPlus className="mr-2" size={16} />
            Add New Customer
          </button>
        </div>
      </div>

      {/* Advanced Filters & Controls */}
      <div className={`mb-6 p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/80 border border-gray-200'} shadow-lg backdrop-blur`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={14} />
              <input
                type="text"
                name="phoneNumber"
                placeholder="Search by phone number, name, or email..."
                value={filters.phoneNumber}
                onChange={handleFilterChange}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-sm ${
                  isDarkMode
                    ? 'bg-gray-700/50 text-white border-gray-600 hover:border-gray-500 placeholder-gray-400'
                    : 'bg-white text-gray-800 border-gray-300 hover:border-gray-400 placeholder-gray-500'
                }`}
              />
            </div>
            {/* <div className="relative">
              <FaFilter className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={14} />
              <select
                value={pagination.pageSize}
                onChange={handlePageSizeChange}
                className={`pl-10 pr-8 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-sm ${
                  isDarkMode
                    ? 'bg-gray-700/50 text-white border-gray-600 hover:border-gray-500'
                    : 'bg-white text-gray-800 border-gray-300 hover:border-gray-400'
                }`}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={15}>15 per page</option>
                <option value={25}>25 per page</option>
              </select>
            </div> */}
          </div>

          {/* View Mode Toggle */}
          <div className={`flex rounded-lg border ${isDarkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-gray-100'} p-1`}>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'table'
                  ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                  : (isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'grid'
                  ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                  : (isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
              }`}
            >
              Grid
            </button>
          </div>
        </div>
      </div>
      {loading ? (
        <div className={`p-8 rounded-2xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'} shadow-lg text-center`}>
          <div className="inline-flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading customers...</span>
          </div>
        </div>
      ) : error ? (
        <div className={`p-8 rounded-2xl ${isDarkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'} shadow-lg text-center`}>
          <p className={`text-lg ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
        </div>
      ) : (
        <>
          {/* Table View */}
          {viewMode === 'table' && (
            <div className={`rounded-2xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/80 border border-gray-200'} shadow-xl overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <tr>
                      <th 
                        className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-2">
                          <FaUser size={12} />
                          Name
                          <FaSort size={10} className={sortBy === 'name' ? 'text-blue-500' : 'opacity-50'} />
                        </div>
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <div className="flex items-center gap-2">
                          <FaPhone size={12} />
                          Phone
                        </div>
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <div className="flex items-center gap-2">
                          <FaPhone size={12} />
                          Alt Phone
                        </div>
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <div className="flex items-center gap-2">
                          <FaEnvelope size={12} />
                          Email
                        </div>
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <div className="flex items-center gap-2">
                          <FaDesktop size={12} />
                          Devices
                        </div>
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {sortedCustomers.map((customer, index) => (
                      <tr 
                        key={customer._id} 
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 ${
                          index % 2 === 0 ? (isDarkMode ? 'bg-gray-800/30' : 'bg-white') : (isDarkMode ? 'bg-gray-800/10' : 'bg-gray-50/50')
                        }`}
                      >
                        <td className={`px-6 py-4 whitespace-nowrap ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${isDarkMode ? 'bg-blue-600/20 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                              <FaUser size={14} />
                            </div>
                            <div>
                              <div className="font-medium">
                                {customer.name?.toLowerCase()
                                  .split(" ")
                                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                  .join(" ") || "N/A"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {customer.phoneNumber || "N/A"}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {customer.alternativePhoneNumber || "N/A"}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {customer.email || "N/A"}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            (customer.devices?.length || 0) > 0 
                              ? (isDarkMode ? 'bg-green-900/20 text-green-300' : 'bg-green-100 text-green-800')
                              : (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')
                          }`}>
                            {customer.devices?.length || 0} device{(customer.devices?.length || 0) !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            {/* <button 
                              onClick={() => handleViewCustomer(customer)}
                              className={`p-2 rounded-lg transition-colors duration-200 ${isDarkMode ? 'hover:bg-blue-600/20 text-blue-300' : 'hover:bg-blue-100 text-blue-600'}`}
                              title="View Customer"
                            >
                              <FaEye size={14} />
                            </button> */}
                            <button 
                              onClick={() => handleEditCustomer(customer)}
                              className={`p-2 rounded-lg transition-colors duration-200 ${isDarkMode ? 'hover:bg-green-600/20 text-green-300' : 'hover:bg-green-100 text-green-600'}`}
                              title="Edit Customer"
                            >
                              <FaEdit size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedCustomers.map((customer) => (
                <div 
                  key={customer._id} 
                  className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700 hover:bg-gray-800/70' : 'bg-white/80 border border-gray-200 hover:bg-white'} shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-blue-600/20 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                      <FaUser size={18} />
                    </div>
                    <div className="flex gap-2">
                      {/* <button 
                        onClick={() => handleViewCustomer(customer)}
                        className={`p-2 rounded-lg transition-colors duration-200 ${isDarkMode ? 'hover:bg-blue-600/20 text-blue-300' : 'hover:bg-blue-100 text-blue-600'}`}
                        title="View Customer"
                      >
                        <FaEye size={14} />
                      </button> */}
                      <button 
                        onClick={() => handleEditCustomer(customer)}
                        className={`p-2 rounded-lg transition-colors duration-200 ${isDarkMode ? 'hover:bg-green-600/20 text-green-300' : 'hover:bg-green-100 text-green-600'}`}
                        title="Edit Customer"
                      >
                        <FaEdit size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {customer.name?.toLowerCase()
                        .split(" ")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ") || "N/A"}
                    </h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <FaPhone className={`${isDarkMode ? 'text-green-400' : 'text-green-600'}`} size={14} />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {customer.phoneNumber || "N/A"}
                      </span>
                    </div>
                    {customer.alternativePhoneNumber && (
                      <div className="flex items-center gap-3">
                        <FaPhone className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} size={14} />
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {customer.alternativePhoneNumber}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <FaEnvelope className={`${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} size={14} />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} truncate`}>
                        {customer.email || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FaDesktop className={`${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} size={14} />
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Devices
                        </span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (customer.devices?.length || 0) > 0 
                          ? (isDarkMode ? 'bg-green-900/20 text-green-300' : 'bg-green-100 text-green-800')
                          : (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')
                      }`}>
                        {customer.devices?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modern Pagination */}
          {pagination.totalPages > 1 && (
            <div className={`mt-8 p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/80 border border-gray-200'} shadow-lg`}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Showing <span className="font-medium">{(pagination.currentPage - 1) * pagination.pageSize + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(pagination.currentPage * pagination.pageSize, pagination.totalRecords)}</span> of{' '}
                  <span className="font-medium">{pagination.totalRecords}</span> customers
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevious}
                    disabled={pagination.currentPage === 1}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      pagination.currentPage === 1
                        ? (isDarkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                        : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                    }`}
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter(page => 
                        page === 1 || 
                        page === pagination.totalPages || 
                        (page >= pagination.currentPage - 1 && page <= pagination.currentPage + 1)
                      )
                      .map((page, index, array) => (
                        <React.Fragment key={page}>
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className={`px-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>...</span>
                          )}
                          <button
                            onClick={() => setPagination(prev => ({ ...prev, currentPage: page }))}
                            className={`w-10 h-10 rounded-xl text-sm font-medium transition-all duration-200 ${
                              page === pagination.currentPage
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      ))}
                  </div>
                  
                  <button
                    onClick={handleNext}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      pagination.currentPage === pagination.totalPages
                        ? (isDarkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                        : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modern Add Customer Modal */}
      {showCustomerForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center overflow-y-auto">
          <div className={`${isDarkMode ? 'bg-gray-800/90 border border-gray-700' : 'bg-white/90 border border-gray-200'} backdrop-blur-md p-8 rounded-3xl shadow-2xl w-full max-w-4xl mx-4 overflow-y-auto max-h-[90vh] relative`}>
            <button
              onClick={handleCloseCustomerForm}
              className={`absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FaTimes size={16} />
            </button>
            <h2 className={`text-3xl font-bold mb-8 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Add New Customer
            </h2>
            <CustomerProfile onClose={handleCloseCustomerForm} setReloadData={setReloadData} />
          </div>
        </div>
      )}

      {/* View Customer Modal */}
      {showViewModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center overflow-y-auto">
          <div className={`${isDarkMode ? 'bg-gray-800/90 border border-gray-700' : 'bg-white/90 border border-gray-200'} backdrop-blur-md p-8 rounded-3xl shadow-2xl w-full max-w-4xl mx-4 overflow-y-auto max-h-[90vh] relative`}>
            <button
              onClick={handleCloseViewModal}
              className={`absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FaTimes size={16} />
            </button>
            
            <div className="text-center mb-8">
              <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${isDarkMode ? 'bg-blue-600/20 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                <FaUser size={32} />
              </div>
              <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Customer Details
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Personal Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Full Name
                    </label>
                    <p className={`mt-1 text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedCustomer.name?.toLowerCase()
                        .split(" ")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ") || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Email Address
                    </label>
                    <p className={`mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedCustomer.email || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Primary Phone
                    </label>
                    <p className={`mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedCustomer.phoneNumber || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Alternative Phone
                    </label>
                    <p className={`mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedCustomer.alternativePhoneNumber || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Device Information */}
              <div className={`md:col-span-2 p-6 rounded-2xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Registered Devices ({selectedCustomer.devices?.length || 0})
                </h3>
                {selectedCustomer.devices && selectedCustomer.devices.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedCustomer.devices.map((device, index) => (
                      <div key={index} className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-600/50 border-gray-500' : 'bg-white border-gray-200'} border shadow-sm hover:shadow-md transition-shadow duration-200`}>
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-indigo-900/30' : 'bg-indigo-100'}`}>
                            <FaDesktop className={`${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} size={16} />
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {device.deviceType?.name || 
                               device.type?.name || 
                               device.deviceType || 
                               device.type || 
                               "Unknown Device"}
                            </h4>
                            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {device.deviceModel?.name || 
                               device.model?.name || 
                               device.deviceModel || 
                               device.model || 
                               "Model Unknown"} • Device #{index + 1}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              Model:
                            </span>
                            <span className={`text-xs ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {device.deviceModel?.name || 
                               device.model?.name || 
                               device.deviceModel || 
                               device.model || 
                               "N/A"}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              Type:
                            </span>
                            <span className={`text-xs ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {device.deviceType?.name || 
                               device.type?.name || 
                               device.deviceType || 
                               device.type || 
                               "N/A"}
                            </span>
                          </div>
                          
                          {device.brand && (
                            <div className="flex justify-between items-center">
                              <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                Brand:
                              </span>
                              <span className={`text-xs ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {device.brand.name || device.brand}
                              </span>
                            </div>
                          )}
                          
                          {device.serialNumber && (
                            <div className="flex justify-between items-center">
                              <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                Serial:
                              </span>
                              <span className={`text-xs font-mono ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {device.serialNumber}
                              </span>
                            </div>
                          )}
                          
                          {device.imei && (
                            <div className="flex justify-between items-center">
                              <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                IMEI:
                              </span>
                              <span className={`text-xs font-mono ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {device.imei}
                              </span>
                            </div>
                          )}
                          
                          {device.color && (
                            <div className="flex justify-between items-center">
                              <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                Color:
                              </span>
                              <span className={`text-xs ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {device.color}
                              </span>
                            </div>
                          )}
                          
                          {device.storage && (
                            <div className="flex justify-between items-center">
                              <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                Storage:
                              </span>
                              <span className={`text-xs ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {device.storage}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Device Status Badge */}
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            device.status === 'active' 
                              ? (isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700')
                              : (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')
                          }`}>
                            {device.status || 'Active'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-12 ${isDarkMode ? 'bg-gray-600/30' : 'bg-gray-50'} rounded-lg border-2 border-dashed ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                    <FaDesktop className={`mx-auto mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} size={32} />
                    <p className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No devices registered
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      This customer hasn't registered any devices yet
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={() => {
                  handleCloseViewModal();
                  handleEditCustomer(selectedCustomer);
                }}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <FaEdit className="mr-2" size={16} />
                Edit Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center overflow-y-auto">
          <div className={`${isDarkMode ? 'bg-gray-800/90 border border-gray-700' : 'bg-white/90 border border-gray-200'} backdrop-blur-md p-8 rounded-3xl shadow-2xl w-full max-w-4xl mx-4 overflow-y-auto max-h-[90vh] relative`}>
            <button
              onClick={handleCloseEditModal}
              className={`absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FaTimes size={16} />
            </button>
            <h2 className={`text-3xl font-bold mb-8 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Edit Customer
            </h2>
            <CustomerProfile 
              onClose={handleCloseEditModal} 
              setReloadData={setReloadData} 
              customer={selectedCustomer}
              isEdit={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
