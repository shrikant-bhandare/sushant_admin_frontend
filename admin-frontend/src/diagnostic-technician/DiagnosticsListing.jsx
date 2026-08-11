import React, { useState, useEffect } from 'react';
import FilterBar from '../components/invoice/FilterBar';
import { useTheme } from '../context/ThemeContext';
import DiagnosticTable from '../components/tables/DiagnosticTable';
import { useNavigate } from 'react-router-dom';
import useLoader from '../customHooks/useLoader'; // Import the useLoader hook
import { FaStethoscope, FaClipboardList, FaSearch, FaFilter, FaHashtag, FaClock, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const DiagnosticsListing = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { Loader, showLoader, hideLoader } = useLoader(); // Destructure loader functions
  const [filteredDiagnostics, setFilteredDiagnostics] = useState([]);
  const [diagnosticStats, setDiagnosticStats] = useState({
    total: 0,
    open: 0,
    postDiagnostic: 0,
    completed: 0
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    totalRecords: 0,
  });

  const handleFilter = async (filters, page = 1, pageSize = pagination.pageSize) => {
    showLoader(); // Show loader before API call
    try {
      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/sale-orders/filter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ 
          ...filters, 
          page, 
          pageSize, 
            status: ["open","PostDiagnostic","Completed"],
        }),
      });
      const data = await response.json();
      if (data.success) {
        setFilteredDiagnostics(data.data);
        
        // Calculate stats
        const total = data.pagination.totalRecords; // Use total records from pagination for accurate count
        const open = data.data.filter(item => item.status === 'open').length;
        const postDiagnostic = data.data.filter(item => item.status === 'PostDiagnostic').length;
        const completed = data.data.filter(item => item.status === 'Completed').length;
        setDiagnosticStats({ total, open, postDiagnostic, completed });
        
        setPagination({
          currentPage: data.pagination.currentPage,
          pageSize: data.pagination.pageSize,
          totalPages: data.pagination.totalPages,
          totalRecords: data.pagination.totalRecords,
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

  const onclick = (invoiceId) => {
    console.log('Diagnose invoice:', invoiceId);
    navigate(`/diagnostic-technician/diagnose/${invoiceId}`);
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
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${isDarkMode ? 'from-blue-600 to-blue-700 shadow-blue-500/25' : 'from-blue-100 to-blue-200 shadow-blue-200/50'} shadow-xl`}>
            <FaStethoscope className={`text-2xl ${isDarkMode ? 'text-white' : 'text-blue-600'}`} />
          </div>
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Diagnostic Dashboard
            </h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage and review device diagnostics and repair assessments
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            title: 'Total Cases',
            value: diagnosticStats.total,
            icon: FaHashtag,
            color: 'indigo',
          },
          {
            title: 'Open Cases',
            value: diagnosticStats.open,
            icon: FaClipboardList,
            color: 'blue',
          },
          {
            title: 'Post Diagnostic',
            value: diagnosticStats.postDiagnostic,
            icon: FaClock,
            color: 'yellow',
          },
          {
            title: 'Completed',
            value: diagnosticStats.completed,
            icon: FaCheckCircle,
            color: 'green',
          }
        ].map((stat, index) => {
          const colorConfig = {
            indigo: {
              bg: isDarkMode ? 'from-indigo-900/50 to-indigo-800/50' : 'from-indigo-50 to-indigo-100',
              border: isDarkMode ? 'border-indigo-700' : 'border-indigo-200',
              icon: isDarkMode ? 'text-indigo-400' : 'text-indigo-600',
              iconBg: isDarkMode ? 'bg-indigo-600/20' : 'bg-indigo-100'
            },
            blue: {
              bg: isDarkMode ? 'from-blue-900/50 to-blue-800/50' : 'from-blue-50 to-blue-100',
              border: isDarkMode ? 'border-blue-700' : 'border-blue-200',
              icon: isDarkMode ? 'text-blue-400' : 'text-blue-600',
              iconBg: isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'
            },
            yellow: {
              bg: isDarkMode ? 'from-yellow-900/50 to-yellow-800/50' : 'from-yellow-50 to-yellow-100',
              border: isDarkMode ? 'border-yellow-700' : 'border-yellow-200',
              icon: isDarkMode ? 'text-yellow-400' : 'text-yellow-600',
              iconBg: isDarkMode ? 'bg-yellow-600/20' : 'bg-yellow-100'
            },
            green: {
              bg: isDarkMode ? 'from-green-900/50 to-green-800/50' : 'from-green-50 to-green-100',
              border: isDarkMode ? 'border-green-700' : 'border-green-200',
              icon: isDarkMode ? 'text-green-400' : 'text-green-600',
              iconBg: isDarkMode ? 'bg-green-600/20' : 'bg-green-100'
            }
          };

          const config = colorConfig[stat.color];
          const Icon = stat.icon;

          return (
            <div
              key={index}
              className={`bg-gradient-to-br ${config.bg} rounded-2xl border ${config.border} p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {stat.title}
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${config.iconBg}`}>
                  <Icon className={`text-xl ${config.icon}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Section */}
      {/* <div className={`mb-6 p-4 rounded-2xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/80 border border-gray-200'} shadow-lg`}> */}
        {/* <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-600/20' : 'bg-purple-100'}`}>
            <FaFilter className={`text-sm ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Filter Diagnostics
          </h2>
        </div> */}
        <FilterBar onFilter={(filters) => handleFilter(filters)} />
      {/* </div> */}

      {/* Diagnostic Table */}
      <div className="mb-6">
        <DiagnosticTable
          invoices={filteredDiagnostics}
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onclick={onclick}
        />
      </div>
    </div>
  );
};

export default DiagnosticsListing;