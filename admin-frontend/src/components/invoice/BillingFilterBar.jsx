import React, { useState } from 'react';
import { FaSearch, FaCalendarAlt, FaFilter, FaTimes, FaUser, FaPhone } from 'react-icons/fa';

const BillingFilterBar = ({ onFilter }) => {
  const [filters, setFilters] = useState({
    search: '',
    customerName: '',
    phone: '',
    dateFrom: '',
    dateTo: '',
    status: ''
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    
    // Auto-filter when user types in search
    if (name === 'search') {
      onFilter(newFilters);
    }
  };

  const handleFilter = () => {
    onFilter(filters);
  };

  const handleReset = () => {
    const resetFilters = {
      search: '',
      customerName: '',
      phone: '',
      dateFrom: '',
      dateTo: '',
      status: ''
    };
    setFilters(resetFilters);
    onFilter(resetFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Main Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        {/* Search Input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleInputChange}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Search by ticket number, customer name, or phone..."
          />
          {filters.search && (
            <button
              onClick={() => handleInputChange({ target: { name: 'search', value: '' } })}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <FaTimes className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Quick Status Filter */}
        <div className="flex gap-2">
          <select
            name="status"
            value={filters.status}
            onChange={handleInputChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Advanced Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
              showAdvanced 
                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
          >
            <FaFilter className="inline mr-1" size={12} />
            Filters
          </button>

          {/* Clear All */}
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Customer Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <FaUser className="inline mr-1" size={10} />
                Customer Name
              </label>
              <input
                type="text"
                name="customerName"
                value={filters.customerName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Enter customer name"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <FaPhone className="inline mr-1" size={10} />
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                value={filters.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Enter phone number"
              />
            </div>

            {/* Date From */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <FaCalendarAlt className="inline mr-1" size={10} />
                Date From
              </label>
              <input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <FaCalendarAlt className="inline mr-1" size={10} />
                Date To
              </label>
              <input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Apply Filters Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleFilter}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingFilterBar;
