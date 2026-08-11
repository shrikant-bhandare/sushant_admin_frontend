import React, { useState, useEffect } from 'react';
import TechnicianRepairOrdersTable from '../components/tables/TechnicianRepairOrdersTable';
import { useTheme } from '../context/ThemeContext';
import { FaTasks, FaFilter, FaSearch, FaCog, FaUser, FaExclamationTriangle, FaChartBar, FaClock, FaCheckCircle } from 'react-icons/fa';

const TasksView = () => {
  const { isDarkMode } = useTheme();
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    totalRecords: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    priorityLevel: '',
    technician: '',
  });
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0
  });

  useEffect(() => {
    const fetchTechnicians = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${import.meta.env.VITE_APIURL}/api/user/list-users?role=technician`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data.status === 'Success') {
          setTechnicians(data.data);
        }
      } catch (error) {
        console.error('Error fetching technicians:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchTaskStats = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${import.meta.env.VITE_APIURL}/api/task/list-tasks`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data.statusCode === 200) {
          const tasks = data.data;
          // Calculate stats from the tasks
          const stats = {
            total: tasks.length,
            pending: tasks.filter(task => task.status === 'Pending').length,
            inProgress: tasks.filter(task => task.status === 'In Progress').length,
            completed: tasks.filter(task => task.status === 'Completed').length,
          };
          setTaskStats(stats);
        }
      } catch (error) {
        console.error('Error fetching task stats:', error);
      }
    };

    fetchTechnicians();
    fetchTaskStats();
  }, []);

  // Debug effect to log filter changes
  useEffect(() => {
    console.log('Filters changed:', filters);
  }, [filters]);

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
  };

  const handlePageSizeChange = (newPageSize) => {
    setPagination((prev) => ({ ...prev, pageSize: newPageSize, currentPage: 1 }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ 
      ...prev, 
      [name]: value 
    }));
    // Reset to first page when filters change
    setPagination((prev) => ({ 
      ...prev, 
      currentPage: 1 
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      priorityLevel: '',
      technician: '',
    });
    // Reset to first page when clearing filters
    setPagination((prev) => ({ 
      ...prev, 
      currentPage: 1 
    }));
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== '').length;
  };

  return (
    <div className={`min-h-screen p-4 sm:p-6 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
      {/* Modern Header */}
      <div className={`mb-8 p-6 rounded-2xl ${isDarkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-700' : 'bg-gradient-to-r from-white to-gray-50 border border-gray-200'} shadow-xl`}>
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${isDarkMode ? 'from-blue-600 to-blue-700 shadow-blue-500/25' : 'from-blue-100 to-blue-200 shadow-blue-200/50'} shadow-xl`}>
            <FaTasks className={`text-2xl ${isDarkMode ? 'text-white' : 'text-blue-600'}`} />
          </div>
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Task Management Center
            </h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Monitor and manage all repair tasks across technicians
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            title: 'Total Tasks',
            value: taskStats.total,
            icon: FaChartBar,
            color: 'indigo',
            change: '+12%'
          },
          {
            title: 'Pending',
            value: taskStats.pending,
            icon: FaClock,
            color: 'yellow',
            change: '+5%'
          },
          {
            title: 'In Progress',
            value: taskStats.inProgress,
            icon: FaCog,
            color: 'blue',
            change: '+8%'
          },
          {
            title: 'Completed',
            value: taskStats.completed,
            icon: FaCheckCircle,
            color: 'green',
            change: '+15%'
          }
        ].map((stat, index) => {
          const colorConfig = {
            indigo: {
              bg: isDarkMode ? 'from-indigo-900/50 to-indigo-800/50' : 'from-indigo-50 to-indigo-100',
              border: isDarkMode ? 'border-indigo-700' : 'border-indigo-200',
              icon: isDarkMode ? 'text-indigo-400' : 'text-indigo-600',
              iconBg: isDarkMode ? 'bg-indigo-600/20' : 'bg-indigo-100'
            },
            yellow: {
              bg: isDarkMode ? 'from-yellow-900/50 to-yellow-800/50' : 'from-yellow-50 to-yellow-100',
              border: isDarkMode ? 'border-yellow-700' : 'border-yellow-200',
              icon: isDarkMode ? 'text-yellow-400' : 'text-yellow-600',
              iconBg: isDarkMode ? 'bg-yellow-600/20' : 'bg-yellow-100'
            },
            blue: {
              bg: isDarkMode ? 'from-blue-900/50 to-blue-800/50' : 'from-blue-50 to-blue-100',
              border: isDarkMode ? 'border-blue-700' : 'border-blue-200',
              icon: isDarkMode ? 'text-blue-400' : 'text-blue-600',
              iconBg: isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'
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
                  <div className="flex items-center mt-2">
                    <span className={`text-xs font-medium ${config.icon}`}>
                      {stat.change}
                    </span>
                    <span className={`text-xs ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      from last week
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${config.iconBg}`}>
                  <Icon className={`text-xl ${config.icon}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div> */}

      {/* Filters Section */}
      <div className={`mb-6 p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-600/20' : 'bg-purple-100'}`}>
              <FaFilter className={`text-lg ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Filter Tasks
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {getActiveFiltersCount() > 0 ? (
                  <>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-2 ${
                      isDarkMode ? 'bg-blue-600/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {getActiveFiltersCount()} filters active
                    </span>
                    <span>Click Clear Filters to reset</span>
                  </>
                ) : (
                  'No filters applied'
                )}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {getActiveFiltersCount() > 0 && (
              <button
                onClick={clearFilters}
                className={`px-4 py-2 rounded-lg border transition-all duration-200 text-sm ${
                  isDarkMode
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700/50'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Clear Filters
              </button>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className={`px-4 py-2 rounded-lg transition-all duration-200 text-sm ${
                isDarkMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Status
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                filters.status 
                  ? isDarkMode
                    ? 'bg-blue-900/20 border-blue-700 text-white ring-2 ring-blue-500/50'
                    : 'bg-blue-50 border-blue-300 text-gray-900 ring-2 ring-blue-500/50'
                  : isDarkMode
                    ? 'bg-gray-700/50 border-gray-600 text-white focus:ring-blue-500/50 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500/50 focus:border-blue-500'
              } focus:outline-none focus:ring-2`}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Priority Level
            </label>
            <select
              id="priorityLevel"
              name="priorityLevel"
              value={filters.priorityLevel}
              onChange={handleFilterChange}
              className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                filters.priorityLevel 
                  ? isDarkMode
                    ? 'bg-orange-900/20 border-orange-700 text-white ring-2 ring-orange-500/50'
                    : 'bg-orange-50 border-orange-300 text-gray-900 ring-2 ring-orange-500/50'
                  : isDarkMode
                    ? 'bg-gray-700/50 border-gray-600 text-white focus:ring-blue-500/50 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500/50 focus:border-blue-500'
              } focus:outline-none focus:ring-2`}
            >
              <option value="">All Priorities</option>
              <option value="Low">Low Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="High">High Priority</option>
            </select>
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <div className="flex items-center gap-2">
                <FaUser className="text-xs" />
                Technician
              </div>
            </label>
            <select
              id="technician"
              name="technician"
              value={filters.technician}
              onChange={handleFilterChange}
              className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                filters.technician 
                  ? isDarkMode
                    ? 'bg-purple-900/20 border-purple-700 text-white ring-2 ring-purple-500/50'
                    : 'bg-purple-50 border-purple-300 text-gray-900 ring-2 ring-purple-500/50'
                  : isDarkMode
                    ? 'bg-gray-700/50 border-gray-600 text-white focus:ring-blue-500/50 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500/50 focus:border-blue-500'
              } focus:outline-none focus:ring-2`}
            >
              <option value="">All Technicians</option>
              {loading ? (
                <option value="">Loading technicians...</option>
              ) : (
                technicians.map((tech) => (
                  <option key={tech._id} value={tech._id}>
                    {tech.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <TechnicianRepairOrdersTable
        filters={filters}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
};

export default TasksView;
