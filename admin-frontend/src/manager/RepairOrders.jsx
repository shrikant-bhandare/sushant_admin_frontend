import React, { useState, useEffect } from 'react';
import FilterBar from '../components/invoice/FilterBar';
import { useTheme } from '../context/ThemeContext';
import DiagnosticTable from '../components/tables/DiagnosticTable';
import { useNavigate } from 'react-router-dom';
import RepairOrdersTable from '../components/tables/RepairOrdersTable';
import useLoader from '../customHooks/useLoader'; // Import the useLoader hook
import { FaTools, FaClipboardList, FaUserCog, FaSearch, FaFilter, FaPlus, FaChartBar, FaClock, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const RepairOrders = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { Loader, showLoader, hideLoader } = useLoader(); // Destructure loader functions
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    totalRecords: 0,
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });

  const handleFilter = async (filters, page = 1, pageSize = pagination.pageSize) => {
    showLoader(); // Show loader before API call
    try {
      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/sale-orders/filter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ 
          ...filters, 
          page, 
          pageSize, 
          status: "ticketRaised",
          preDiagnosed: "yes"
        }),
      });
      const data = await response.json();
      if (data.success) {
        setFilteredOrders(data.data);
        setPagination({
          currentPage: data.pagination.currentPage,
          pageSize: data.pagination.pageSize,
          totalPages: data.pagination.totalPages,
          totalRecords: data.pagination.totalRecords,
        });
        
        // Calculate stats from the data
        const orders = data.data || [];
        setStats({
          total: orders.length,
          pending: orders.filter(order => order.status === 'pending').length,
          inProgress: orders.filter(order => order.status === 'in-progress').length,
          completed: orders.filter(order => order.status === 'completed').length,
        });
      } else {
        console.error('Failed to fetch filtered data:', data.message);
      }
    } catch (error) {
      console.error('Error fetching filtered data:', error);
    } finally {
      hideLoader(); // Hide loader after API call
    }
  };

  useEffect(() => {
    handleFilter();
  }, []);

  const onclick = (orderId) => {
    console.log('Assign technician to order:', orderId);
    navigate(`/manager/assign-technician/${orderId}`);
  };

  const handlePageChange = (newPage) => {
    handleFilter({}, newPage, pagination.pageSize);
  };

  const handlePageSizeChange = (newPageSize) => {
    handleFilter({}, 1, newPageSize); // Reset to page 1 when page size changes
  };

  return (
    <div className={`min-h-screen p-4 sm:p-6 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
      <Loader /> {/* Render the loader */}
      
      {/* Modern Header */}
      <div className={`mb-8 p-6 rounded-2xl ${isDarkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-700' : 'bg-gradient-to-r from-white to-gray-50 border border-gray-200'} shadow-xl`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl bg-gradient-to-br ${isDarkMode ? 'from-blue-600 to-blue-700 shadow-blue-500/25' : 'from-blue-100 to-blue-200 shadow-blue-200/50'} shadow-xl`}>
              <FaTools className={`text-2xl ${isDarkMode ? 'text-white' : 'text-blue-600'}`} />
            </div>
            <div>
              <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Repair Orders Management
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage repair orders and assign technicians ({pagination.totalRecords} total orders)
              </p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/manager/new-repair-order')}
            className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <FaPlus className="mr-2" size={16} />
            New Repair Order
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'} shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Orders</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.total}</p>
            </div>
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
              <FaClipboardList className={`text-xl ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'} shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pending</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>{stats.pending}</p>
            </div>
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-orange-600/20' : 'bg-orange-100'}`}>
              <FaClock className={`text-xl ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'} shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>In Progress</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>{stats.inProgress}</p>
            </div>
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-yellow-600/20' : 'bg-yellow-100'}`}>
              <FaExclamationTriangle className={`text-xl ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'} shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Completed</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{stats.completed}</p>
            </div>
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-green-600/20' : 'bg-green-100'}`}>
              <FaCheckCircle className={`text-xl ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className={`mb-6 p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/80 border border-gray-200'} shadow-lg backdrop-blur`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-600/20' : 'bg-purple-100'}`}>
            <FaFilter className={`${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} size={16} />
          </div>
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Filter & Search
          </h3>
        </div>
        <FilterBar onFilter={(filters) => handleFilter(filters)} />
      </div>

      {/* Repair Orders Table Section */}
      <div className={`rounded-2xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/80 border border-gray-200'} shadow-xl overflow-hidden`}>
        <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-indigo-600/20' : 'bg-indigo-100'}`}>
              <FaUserCog className={`${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} size={16} />
            </div>
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Repair Orders
            </h3>
            <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${isDarkMode ? 'bg-blue-600/20 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
              {filteredOrders.length} orders
            </span>
          </div>
        </div>
        
        <RepairOrdersTable
          invoices={filteredOrders}
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onclick={onclick}
          buttonText="Assign Technician"
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
};

export default RepairOrders;