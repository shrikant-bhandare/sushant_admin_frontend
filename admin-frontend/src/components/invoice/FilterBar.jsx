import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { FaSearch, FaCalendarAlt, FaFilter, FaTimes, FaUser, FaPhone, FaMobile, FaChevronDown } from 'react-icons/fa';

const FilterBar = ({ onFilter }) => {
  const { isDarkMode } = useTheme();
  const [filters, setFilters] = useState({
    commonSearch: '', // Add common search
    customerName: '',
    phone: '',
    model: '',
    ticketNumber: '', // Add ticketNumber to the filters
    dateFrom: '',
    dateTo: '',
    showDeleted: false, // Add showDeleted toggle
    status: [], // Add status filter array
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false); // Advanced filters are off by default
  const [showStatusDropdown, setShowStatusDropdown] = useState(false); // Control status dropdown visibility
  const statusDropdownRef = useRef(null);

  const statusOptions = [
    { value: 'New', label: 'New', color: 'gray' },
    { value: 'open', label: 'Open', color: 'blue' },
    { value: 'Pending', label: 'Pending', color: 'orange' },
    { value: 'PostDiagnostic', label: 'Post Diagnostic', color: 'yellow' },
    { value: 'preDiagnosed', label: 'Pre Diagnosed', color: 'purple' },
    { value: 'In Progress', label: 'In Progress', color: 'indigo' },
    { value: 'ConvertToSale', label: 'Convert To Sale', color: 'pink' },
    { value: 'Completed', label: 'Completed', color: 'green' },
    { value: 'Paid', label: 'Paid', color: 'blue' },
    { value: 'Cancelled', label: 'Cancelled', color: 'gray' },
    { value: 'deleted', label: 'Deleted', color: 'red' }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = (name) => {
    if (name === 'showDeleted') {
      setFilters((prev) => {
        const newFilters = { ...prev, [name]: !prev[name] };
        // If showDeleted is being turned on, add 'deleted' to status filter if not already there
        if (!prev[name] && !prev.status.includes('deleted')) {
          newFilters.status = [...prev.status, 'deleted'];
        }
        // If showDeleted is being turned off, remove 'deleted' from status filter
        if (prev[name] && prev.status.includes('deleted')) {
          newFilters.status = prev.status.filter(s => s !== 'deleted');
        }
        return newFilters;
      });
    } else {
      setFilters((prev) => ({ ...prev, [name]: !prev[name] }));
    }
  };

  const handleStatusChange = (status) => {
    setFilters((prev) => {
      const newStatus = prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status];
      
      const newFilters = { ...prev, status: newStatus };
      
      // If deleted status is being added/removed, sync with showDeleted toggle
      if (status === 'deleted') {
        newFilters.showDeleted = newStatus.includes('deleted');
      }
      
      return newFilters;
    });
  };

  const handleFilter = () => {
    console.log('FilterBar sending filters:', filters);
    onFilter(filters);
  };

  const handleReset = () => {
    setFilters({
      commonSearch: '', // Reset common search
      customerName: '',
      phone: '',
      model: '',
      ticketNumber: '', // Reset ticketNumber
      dateFrom: '',
      dateTo: '',
      showDeleted: false, // Reset showDeleted
      status: [], // Reset status filter
    });
    onFilter({});
  };

  const containerClass = isDarkMode ? 'text-white' : 'bg-white text-black';
  const inputClass = isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500';
  const buttonClass = isDarkMode ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white';
  const resetButtonClass = isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300';

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 mb-6 relative">
      {/* Header with gradient */}
      {/* <div className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FaFilter className="text-white" size={16} />
            </div>
            <h3 className="text-lg font-bold text-white">Search & Filter Tickets</h3>
          </div>
          <div className="text-xs text-blue-100 bg-white/10 px-3 py-1 rounded-full">
            Quick Search
          </div>
        </div>
      </div> */}

      {/* Content Area */}
      <div className="p-6">
        {/* Common Search Bar */}
        {/* <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="commonSearch"
              value={filters.commonSearch}
              onChange={(e) => {
                handleInputChange(e);
                // Auto-search as user types for common search
                if (e.target.value.length > 2 || e.target.value.length === 0) {
                  const updatedFilters = { ...filters, commonSearch: e.target.value };
                  onFilter(updatedFilters);
                }
              }}
              className={`block w-full pl-10 pr-3 py-3 text-lg border-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${inputClass}`}
              placeholder="🔍 Search tickets, customers, devices, or phone numbers..."
            />
            {filters.commonSearch && (
              <button
                onClick={() => {
                  setFilters(prev => ({ ...prev, commonSearch: '' }));
                  onFilter({ ...filters, commonSearch: '' });
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <FaTimes className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-1">
            💡 Start typing for instant search across all fields
          </p>
        </div> */}

        {/* Advanced Filters Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaFilter size={12} />
              Advanced Search Filters
              <span className={`transform transition-transform duration-200 ${showAdvancedFilters ? 'rotate-180' : ''}`}>
                ↓
              </span>
            </button>
            
            {/* Show Deleted Orders Toggle */}
            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showDeleted}
                  onChange={() => handleToggleChange('showDeleted')}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
              </label>
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} ${filters.showDeleted ? 'text-red-600 dark:text-red-400' : ''}`}>
                Show Deleted Orders
              </span>
            </div>
          </div>
          
          {/* {(filters.commonSearch || filters.ticketNumber || filters.customerName || filters.phone || filters.model || filters.dateFrom || filters.dateTo) && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors duration-200"
            >
              <FaTimes size={12} />
              Clear All Filters
            </button>
          )} */}
        </div>

        {/* Advanced Search Section */}
        {showAdvancedFilters && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            {/* <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
              <FaFilter size={12} />
              Specific Field Filters
            </h4> */}
        {/* Search Fields in Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Ticket Search Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FaSearch className="text-blue-600 dark:text-blue-400" size={12} />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ticket Search</span>
            </div>
            <input
              type="text"
              name="ticketNumber"
              value={filters.ticketNumber}
              onChange={handleInputChange}
              className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${inputClass}`}
              placeholder="Enter ticket number..."
            />
          </div>

          {/* Customer Search Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FaUser className="text-green-600 dark:text-green-400" size={12} />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Customer Info</span>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                name="customerName"
                value={filters.customerName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 ${inputClass}`}
                placeholder="Customer name..."
              />
              <div className="relative">
                <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={10} />
                <input
                  type="text"
                  name="phone"
                  value={filters.phone}
                  onChange={handleInputChange}
                  className={`w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 ${inputClass}`}
                  placeholder="Phone number..."
                />
              </div>
            </div>
          </div>

          {/* Device & Date Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FaMobile className="text-purple-600 dark:text-purple-400" size={12} />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Range</span>
            </div>
            <div className="space-y-2">
              {/* <input
                type="text"
                name="model"
                value={filters.model}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 ${inputClass}`}
                placeholder="Device model..."
              /> */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <FaCalendarAlt className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={10} />
                  <input
                    type="date"
                    name="dateFrom"
                    value={filters.dateFrom}
                    onChange={handleInputChange}
                    className={`w-full pl-7 pr-2 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 ${inputClass}`}
                  />
                </div>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={10} />
                  <input
                    type="date"
                    name="dateTo"
                    value={filters.dateTo}
                    onChange={handleInputChange}
                    className={`w-full pl-7 pr-2 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 ${inputClass}`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Status Filter Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <FaFilter className="text-orange-600 dark:text-orange-400" size={12} />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Order Status</span>
            </div>
            <div className="relative" ref={statusDropdownRef}>
              {/* Status Dropdown Button */}
              <button
                type="button"
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 flex items-center justify-between ${inputClass}`}
              >
                <span className="text-left">
                  {filters.status.length === 0 
                    ? 'Select status...' 
                    : filters.status.length === 1 
                      ? statusOptions.find(s => s.value === filters.status[0])?.label
                      : `${filters.status.length} statuses selected`
                  }
                </span>
                <FaChevronDown className={`transform transition-transform duration-200 ${showStatusDropdown ? 'rotate-180' : ''}`} size={12} />
              </button>
              
              {/* Status Dropdown Menu */}
              {showStatusDropdown && (
                <>
                  {/* Backdrop for mobile/touch devices */}
                  <div 
                    className="fixed inset-0 z-[990]"
                    onClick={() => setShowStatusDropdown(false)}
                  />
                  <div className={`absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-xl z-[999] max-h-48 overflow-y-auto ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                  {statusOptions.map((status) => (
                    <label key={status.value} className={`flex items-center space-x-2 px-3 py-2 cursor-pointer transition-colors duration-150 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                      <input
                        type="checkbox"
                        checked={filters.status.includes(status.value)}
                        onChange={() => handleStatusChange(status.value)}
                        className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 focus:ring-2"
                      />
                      <span className={`text-sm flex-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {status.label}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${
                        status.color === 'blue' ? 'bg-blue-500' :
                        status.color === 'orange' ? 'bg-orange-500' :
                        status.color === 'yellow' ? 'bg-yellow-500' :
                        status.color === 'purple' ? 'bg-purple-500' :
                        status.color === 'indigo' ? 'bg-indigo-500' :
                        status.color === 'pink' ? 'bg-pink-500' :
                        status.color === 'green' ? 'bg-green-500' :
                        status.color === 'gray' ? 'bg-gray-500' :
                        status.color === 'red' ? 'bg-red-500' : 'bg-gray-400'
                      }`}></div>
                    </label>
                  ))}
                  
                  {/* Quick Actions */}
                  <div className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} p-2`}>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFilters(prev => ({ ...prev, status: statusOptions.map(s => s.value) }));
                        }}
                        className="flex-1 px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFilters(prev => ({ ...prev, status: [] }));
                        }}
                        className={`flex-1 px-2 py-1 text-xs border rounded transition-colors ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                </div>
                </>
              )}
              
              {/* Selected Status Tags */}
              {filters.status.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {filters.status.map((statusValue) => {
                    const status = statusOptions.find(s => s.value === statusValue);
                    return (
                      <span
                        key={statusValue}
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                          isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {status?.label}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(statusValue)}
                          className="hover:text-red-500 transition-colors"
                        >
                          <FaTimes size={8} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Use filters to narrow down your search results
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleReset} 
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 hover:scale-105 ${resetButtonClass}`}
            >
              <FaTimes className="mr-2" size={12} />
              Clear All
            </button>
            <button 
              onClick={handleFilter} 
              className={`inline-flex items-center px-6 py-2 text-sm font-medium rounded-lg shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl ${buttonClass}`}
            >
              <FaSearch className="mr-2" size={12} />
              Search Now
            </button>
          </div>
        </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;