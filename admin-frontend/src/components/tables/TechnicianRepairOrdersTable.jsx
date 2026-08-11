import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaArrowRight, FaTools, FaUser, FaClock, FaCog, FaCheckCircle, FaExclamationTriangle, FaSearch, FaFilter, FaSort, FaEllipsisH } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';

const TechnicianRepairOrdersTable = ({ filters = {}, onPageChange, onPageSizeChange }) => {
  const { isDarkMode } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    totalRecords: 0,
  });

  const { currentPage, pageSize, totalPages, totalRecords } = pagination;

  // Filter tasks based on search term
  const filteredTasks = tasks.filter(task =>
    task.taskName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.technician?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (sortField === 'technician') {
      aValue = a.technician?.name || '';
      bValue = b.technician?.name || '';
    }
    
    if (sortField === 'createdAt') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  useEffect(() => {
    fetchTasks(currentPage, pageSize, filters);
  }, [currentPage, pageSize, filters]);

  const fetchTasks = async (page, size, filters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APIURL}/api/task/filter?page=${page}&pageSize=${size}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify(filters),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.statusCode === 200) {
        setTasks(data.data);
        setPagination({
          currentPage: data.pagination.currentPage,
          pageSize: data.pagination.pageSize,
          totalPages: data.pagination.totalPages,
          totalRecords: data.pagination.totalRecords,
        });
      } else {
        throw new Error(data.message || 'Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setPagination((prev) => ({ ...prev, currentPage: currentPage - 1 }));
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: currentPage + 1 }));
    }
  };

  const handlePageSizeChange = (event) => {
    setPagination((prev) => ({
      ...prev,
      pageSize: Number(event.target.value),
      currentPage: 1,
    }));
  };

  // Status configuration for styling
  const getStatusConfig = (status) => {
    const configs = {
      'Pending': {
        bg: isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-100',
        text: isDarkMode ? 'text-yellow-300' : 'text-yellow-700',
        border: isDarkMode ? 'border-yellow-700' : 'border-yellow-300',
        icon: FaClock
      },
      'In Progress': {
        bg: isDarkMode ? 'bg-blue-900/20' : 'bg-blue-100',
        text: isDarkMode ? 'text-blue-300' : 'text-blue-700',
        border: isDarkMode ? 'border-blue-700' : 'border-blue-300',
        icon: FaCog
      },
      'Completed': {
        bg: isDarkMode ? 'bg-green-900/20' : 'bg-green-100',
        text: isDarkMode ? 'text-green-300' : 'text-green-700',
        border: isDarkMode ? 'border-green-700' : 'border-green-300',
        icon: FaCheckCircle
      }
    };
    return configs[status] || configs['Pending'];
  };

  // Priority configuration for styling
  const getPriorityConfig = (priority) => {
    const configs = {
      'Low': {
        bg: isDarkMode ? 'bg-gray-700/20' : 'bg-gray-100',
        text: isDarkMode ? 'text-gray-300' : 'text-gray-600',
        border: isDarkMode ? 'border-gray-600' : 'border-gray-300'
      },
      'Medium': {
        bg: isDarkMode ? 'bg-orange-900/20' : 'bg-orange-100',
        text: isDarkMode ? 'text-orange-300' : 'text-orange-700',
        border: isDarkMode ? 'border-orange-700' : 'border-orange-300'
      },
      'High': {
        bg: isDarkMode ? 'bg-red-900/20' : 'bg-red-100',
        text: isDarkMode ? 'text-red-300' : 'text-red-700',
        border: isDarkMode ? 'border-red-700' : 'border-red-300'
      }
    };
    return configs[priority] || configs['Low'];
  };

  return (
    <div className={`rounded-2xl shadow-xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200'}`}>
      {/* Header Section */}
      <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${isDarkMode ? 'from-blue-600 to-blue-700' : 'from-blue-100 to-blue-200'}`}>
              <FaTools className={`text-lg ${isDarkMode ? 'text-white' : 'text-blue-600'}`} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Repair Tasks Overview
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {totalRecords} total tasks found
              </p>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              <input
                type="text"
                placeholder="Search tasks, tickets, technicians..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-all duration-200 text-sm ${
                  isDarkMode
                    ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500/50 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500/50 focus:border-blue-500'
                } focus:outline-none focus:ring-2`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDarkMode ? 'border-blue-400' : 'border-blue-600'}`}></div>
            <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading tasks...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20 border border-red-700' : 'bg-red-100 border border-red-300'}`}>
              <FaExclamationTriangle className={`inline mr-2 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
              <span className={`${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>Error: {error}</span>
            </div>
          </div>
        ) : (
          <div style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }} className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            <table className="min-w-full">
              <thead className={`sticky top-0 z-10 ${isDarkMode ? 'bg-gray-800/95' : 'bg-gray-50/95'} backdrop-blur-sm`}>
                <tr>
                  <th 
                    className={`py-4 px-6 text-left font-semibold cursor-pointer hover:bg-opacity-80 transition-colors ${isDarkMode ? 'text-gray-200 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-gray-100/50'}`}
                    onClick={() => handleSort('ticketNumber')}
                  >
                    <div className="flex items-center gap-2">
                      Job Number
                      <FaSort className="text-xs opacity-50" />
                    </div>
                  </th>
                  <th 
                    className={`py-4 px-6 text-left font-semibold cursor-pointer hover:bg-opacity-80 transition-colors ${isDarkMode ? 'text-gray-200 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-gray-100/50'}`}
                    onClick={() => handleSort('taskName')}
                  >
                    <div className="flex items-center gap-2">
                      Task Name
                      <FaSort className="text-xs opacity-50" />
                    </div>
                  </th>
                  <th 
                    className={`py-4 px-6 text-left font-semibold cursor-pointer hover:bg-opacity-80 transition-colors ${isDarkMode ? 'text-gray-200 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-gray-100/50'}`}
                    onClick={() => handleSort('technician')}
                  >
                    <div className="flex items-center gap-2">
                      <FaUser className="text-xs" />
                      Technician
                      <FaSort className="text-xs opacity-50" />
                    </div>
                  </th>
                  <th 
                    className={`py-4 px-6 text-left font-semibold cursor-pointer hover:bg-opacity-80 transition-colors ${isDarkMode ? 'text-gray-200 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-gray-100/50'}`}
                    onClick={() => handleSort('priorityLevel')}
                  >
                    <div className="flex items-center gap-2">
                      Priority
                      <FaSort className="text-xs opacity-50" />
                    </div>
                  </th>
                  <th 
                    className={`py-4 px-6 text-left font-semibold cursor-pointer hover:bg-opacity-80 transition-colors ${isDarkMode ? 'text-gray-200 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-gray-100/50'}`}
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      <FaSort className="text-xs opacity-50" />
                    </div>
                  </th>
                  <th 
                    className={`py-4 px-6 text-left font-semibold cursor-pointer hover:bg-opacity-80 transition-colors ${isDarkMode ? 'text-gray-200 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-gray-100/50'}`}
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center gap-2">
                      Created Date
                      <FaSort className="text-xs opacity-50" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedTasks.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center">
                      <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {searchTerm ? 'No tasks found matching your search.' : 'No tasks available.'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedTasks.map((task) => {
                    const statusConfig = getStatusConfig(task.status);
                    const priorityConfig = getPriorityConfig(task.priorityLevel);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <tr 
                        key={task._id} 
                        className={`transition-colors hover:bg-opacity-50 ${
                          isDarkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className={`py-4 px-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          <div className="font-medium">#{task.ticketNumber}</div>
                        </td>
                        <td className={`py-4 px-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          <div className="max-w-xs">
                            <div className="font-medium truncate" title={task.taskName}>
                              {task.taskName
                                ?.toLowerCase()
                                .split(" ")
                                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(" ")}
                            </div>
                          </div>
                        </td>
                        <td className={`py-4 px-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-full ${isDarkMode ? 'bg-purple-600/20' : 'bg-purple-100'}`}>
                              <FaUser className={`text-xs ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                            </div>
                            <span className="font-medium">
                              {task.technician?.name?.toLowerCase()
                                .split(" ")
                                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(" ") || 'Unassigned'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${priorityConfig.bg} ${priorityConfig.text} ${priorityConfig.border}`}>
                            {task.priorityLevel || 'Low'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                            <StatusIcon className="text-xs" />
                            {task.status}
                          </span>
                        </td>
                        <td className={`py-4 px-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                          {new Date(task.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className={`p-6 border-t ${isDarkMode ? 'border-gray-700/50 bg-gray-800/30' : 'border-gray-200/50 bg-gray-50/30'}`}>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Rows per page:
            </label>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className={`px-3 py-2 rounded-lg border text-sm transition-all duration-200 ${
                isDarkMode
                  ? 'bg-gray-700/50 border-gray-600 text-white focus:ring-blue-500/50 focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500/50 focus:border-blue-500'
              } focus:outline-none focus:ring-2`}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
            </select>
          </div>
          
          <div className="flex items-center gap-4">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Page {currentPage} of {totalPages} ({totalRecords} total)
            </span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg border transition-all duration-200 ${
                  currentPage === 1
                    ? isDarkMode
                      ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                      : 'border-gray-200 text-gray-400 cursor-not-allowed'
                    : isDarkMode
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                <FaArrowLeft className="text-sm" />
              </button>
              
              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg border transition-all duration-200 ${
                  currentPage === totalPages
                    ? isDarkMode
                      ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                      : 'border-gray-200 text-gray-400 cursor-not-allowed'
                    : isDarkMode
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                <FaArrowRight className="text-sm" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicianRepairOrdersTable;
