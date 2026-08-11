import React, { useEffect, useState } from "react";
import axios from "axios";
import { getAuthAxiosConfig } from "../utils/authUtils";
import { useTheme } from "../context/ThemeContext"; // Import ThemeContext
import { FaBox, FaClock, FaCheckCircle, FaUser, FaDesktop, FaCog, FaExclamationTriangle, FaCalendarAlt, FaMoneyBillWave, FaHashtag, FaTasks, FaFilter, FaTh, FaTable, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import useUserId from "../customHooks/useUserid";

const InventoryPartsRequests = () => {
    const userId = useUserId();
  const [partRequests, setPartRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("Pending"); // State to manage active tab
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [requestStats, setRequestStats] = useState({
    total: 0,
    pending: 0,
    approved: 0
  });
  const { isDarkMode } = useTheme(); // Get the current theme

  // Fetch part requests on component mount
  useEffect(() => {
    const fetchPartRequests = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_APIURL}/api/part-requests`, {
          headers: { accept: "application/json", 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
        });
        setPartRequests(response.data);
        
        // Calculate stats
        const total = response.data.length;
        const pending = response.data.filter(req => req.status === 'Pending').length;
        const approved = response.data.filter(req => req.status === 'Approved').length;
        setRequestStats({ total, pending, approved });
        
        setLoading(false);
        console.log(response);
      } catch {
        setError("Failed to fetch part requests");
        setLoading(false);
      }
    };

    fetchPartRequests();
  }, []);

  // Approve a part request
  const approveRequest = async (requestId) => {
    try {
      const authConfig = getAuthAxiosConfig();
      const response = await axios.patch(
        `${import.meta.env.VITE_APIURL}/api/part-requests/${requestId}`,
        { status: "Approved", userId: userId },
        {
          ...authConfig,
          headers: {
            ...authConfig.headers,
            accept: "*/*",
            "Content-Type": "application/json",
          },
        }
      );
      alert(response.data.message);
      // Update the status of the approved request locally
      setPartRequests((prevRequests) =>
        prevRequests.map((request) =>
          request._id === requestId ? { ...request, status: "Approved" } : request
        )
      );
      
      // Update stats
      setRequestStats(prev => ({
        ...prev,
        pending: prev.pending - 1,
        approved: prev.approved + 1
      }));
    } catch {
      alert("Failed to approve the request");
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      const authConfig = getAuthAxiosConfig();
      const response = await axios.patch(
        `${import.meta.env.VITE_APIURL}/api/part-requests/${requestId}`,
        { status: "Rejected" },
        {
          ...authConfig,
          headers: {
            ...authConfig.headers,
            accept: "*/*",
            "Content-Type": "application/json",
          },
        }
      );
      alert(response.data.message);
      // Update the status of the rejected request locally
      setPartRequests((prevRequests) =>
        prevRequests.map((request) =>
          request._id === requestId ? { ...request, status: "Rejected" } : request
        )
      );
      
      // Update stats
      setRequestStats(prev => ({
        ...prev,
        pending: prev.pending - 1
      }));
    } catch {
      alert("Failed to reject the request");
    }
  };

  const filteredRequests = partRequests.filter(
    (request) => request.status === activeTab
  );

  // Sort requests
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'partName':
        aValue = a.part.name.toLowerCase();
        bValue = b.part.name.toLowerCase();
        break;
      case 'deviceType':
        aValue = a.part.deviceType.name.toLowerCase();
        bValue = b.part.deviceType.name.toLowerCase();
        break;
      case 'requestedBy':
        aValue = a.requestedBy.name.toLowerCase();
        bValue = b.requestedBy.name.toLowerCase();
        break;
      case 'price':
        aValue = a.part.price * a.quantity;
        bValue = b.part.price * b.quantity;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      default:
        aValue = a.createdAt;
        bValue = b.createdAt;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <FaSort className="opacity-50" />;
    return sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
      <div className="flex items-center gap-3">
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDarkMode ? 'border-blue-400' : 'border-blue-600'}`}></div>
        <span className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading part requests...</span>
      </div>
    </div>
  );
  
  if (error) return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
      <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-red-900/20 border border-red-700' : 'bg-red-100 border border-red-300'}`}>
        <FaExclamationTriangle className={`inline mr-2 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
        <span className={`${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</span>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen p-4 sm:p-6 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
      {/* Modern Header */}
      <div className={`mb-8 p-6 rounded-2xl ${isDarkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-700' : 'bg-gradient-to-r from-white to-gray-50 border border-gray-200'} shadow-xl`}>
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${isDarkMode ? 'from-purple-600 to-purple-700 shadow-purple-500/25' : 'from-purple-100 to-purple-200 shadow-purple-200/50'} shadow-xl`}>
            <FaBox className={`text-2xl ${isDarkMode ? 'text-white' : 'text-purple-600'}`} />
          </div>
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Parts Request Management
            </h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Review and manage inventory part requests from technicians
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {[
          {
            title: 'Total Requests',
            value: requestStats.total,
            icon: FaHashtag,
            color: 'indigo',
          },
          {
            title: 'Pending',
            value: requestStats.pending,
            icon: FaClock,
            color: 'yellow',
          },
          {
            title: 'Approved',
            value: requestStats.approved,
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

      {/* Status Tabs */}
      <div className={`mb-6 p-2 rounded-2xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/80 border border-gray-200'} shadow-lg`}>
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <div className="flex flex-wrap gap-2">
            {[
              { status: 'Pending', count: requestStats.pending, icon: FaClock, color: 'yellow' },
              { status: 'Approved', count: requestStats.approved, icon: FaCheckCircle, color: 'green' }
            ].map(({ status, count, icon: Icon, color }) => (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 text-sm ${
                  activeTab === status
                    ? `${
                        color === 'yellow'
                          ? isDarkMode
                            ? 'bg-yellow-600/20 text-yellow-300 border border-yellow-700'
                            : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                          : isDarkMode
                          ? 'bg-green-600/20 text-green-300 border border-green-700'
                          : 'bg-green-100 text-green-700 border border-green-300'
                      } shadow-lg transform scale-105`
                    : `${
                        isDarkMode
                          ? 'bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-600/50'
                          : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                      } hover:transform hover:scale-105`
                }`}
              >
                <Icon size={14} />
                <span>{status}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  activeTab === status
                    ? color === 'yellow'
                      ? isDarkMode ? 'bg-yellow-700 text-yellow-200' : 'bg-yellow-200 text-yellow-800'
                      : isDarkMode ? 'bg-green-700 text-green-200' : 'bg-green-200 text-green-800'
                    : isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all duration-300 ${
                viewMode === 'grid'
                  ? isDarkMode
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-700'
                    : 'bg-blue-100 text-blue-600 border border-blue-300'
                  : isDarkMode
                  ? 'bg-gray-700/50 text-gray-400 border border-gray-600 hover:bg-gray-600/50'
                  : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
              }`}
              title="Grid View"
            >
              <FaTh size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all duration-300 ${
                viewMode === 'table'
                  ? isDarkMode
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-700'
                    : 'bg-blue-100 text-blue-600 border border-blue-300'
                  : isDarkMode
                  ? 'bg-gray-700/50 text-gray-400 border border-gray-600 hover:bg-gray-600/50'
                  : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
              }`}
              title="Table View"
            >
              <FaTable size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Requests Content */}
      {viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedRequests.length === 0 ? (
            <div className="col-span-full">
              <div className={`p-12 rounded-2xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'} shadow-lg text-center`}>
                <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <FaBox className={`text-2xl ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  No {activeTab} Requests
                </h3>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No {activeTab.toLowerCase()} part requests found at the moment.
                </p>
              </div>
            </div>
          ) : (
            sortedRequests.map((request) => {
              const statusConfig = {
                'Pending': {
                  bg: isDarkMode ? 'from-yellow-900/50 to-yellow-800/50' : 'from-yellow-50 to-yellow-100',
                  border: isDarkMode ? 'border-yellow-700' : 'border-yellow-300',
                  icon: FaClock,
                  iconColor: isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                },
                'Approved': {
                  bg: isDarkMode ? 'from-green-900/50 to-green-800/50' : 'from-green-50 to-green-100',
                  border: isDarkMode ? 'border-green-700' : 'border-green-300',
                  icon: FaCheckCircle,
                  iconColor: isDarkMode ? 'text-green-400' : 'text-green-600'
                }
              };

              const currentStatus = statusConfig[request.status] || statusConfig['Pending'];
              const StatusIcon = currentStatus.icon;

              return (
                <div
                  key={request._id}
                  className={`bg-gradient-to-br ${currentStatus.bg} rounded-2xl border ${currentStatus.border} shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden flex flex-col h-full`}
                >
                  {/* Card Header */}
                  <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-white/70'}`}>
                          <StatusIcon className={`${currentStatus.iconColor}`} size={16} />
                        </div>
                        <div>
                          <h2 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate max-w-[180px]`} title={request.part?.name || 'Unknown Part'}>
                            {request.part?.name || 'Unknown Part'}
                          </h2>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            #{request.ticketNumber}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${currentStatus.bg} ${currentStatus.iconColor} ${currentStatus.border}`}>
                        {request.status}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 space-y-4 flex-grow">
                    {/* Device Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                          <FaDesktop className={`text-xs ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        </div>
                        <div>
                          <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Device</p>
                          <p className={`font-semibold text-xs ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {request.part?.deviceType?.name || 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-purple-600/20' : 'bg-purple-100'}`}>
                          <FaCog className={`text-xs ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                        </div>
                        <div>
                          <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Model</p>
                          <p className={`font-semibold text-xs ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {request.part?.deviceModel?.name || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Part Details */}
                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Part Type</p>
                          <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {request.part?.partType?.type || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Stock</p>
                          <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {request.part?.stock || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Request Details */}
                    <div className="space-y-3">
                      {/* <div className="flex items-center gap-2">
                        <FaMoneyBillWave className={`${isDarkMode ? 'text-green-400' : 'text-green-600'}`} size={14} />
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <strong>Price:</strong> ₹{request.part?.price || 0} x {request.quantity || 0} = ₹{(request.part?.price || 0) * (request.quantity || 0)}
                        </span>
                      </div> */}
                      
                      <div className="flex items-center gap-2">
                        <FaUser className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} size={14} />
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <strong>By:</strong> {request.requestedBy?.name || 'Unknown'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} size={14} />
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <strong>Date:</strong> {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Task Info */}
                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <FaTasks className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} size={14} />
                        <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Task Details</span>
                      </div>
                      <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {request.taskId?.taskName || 'No task assigned'}
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                        Priority: {request.taskId?.priorityLevel || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {request.status === "Pending" && (
                    <div className={`mt-auto p-6 border-t ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'} bg-gradient-to-r ${isDarkMode ? 'from-gray-800/50 to-gray-700/50' : 'from-gray-50/50 to-white/50'}`}>
                      <div className="flex gap-3">
                        <button
                          onClick={() => approveRequest(request._id)}
                          className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm"
                        >
                          <FaCheckCircle className="mr-2" size={14} />
                          Approve
                        </button>
                        
                        <button
                          onClick={() => rejectRequest(request._id)}
                          className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm"
                        >
                          <FaExclamationTriangle className="mr-2" size={14} />
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Table View */
        <div className={`rounded-2xl shadow-xl overflow-hidden ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          {sortedRequests.length === 0 ? (
            <div className="p-12 text-center">
              <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <FaBox className={`text-2xl ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                No {activeTab} Requests
              </h3>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No {activeTab.toLowerCase()} part requests found at the moment.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} sticky top-0 z-10`}>
                  <tr>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} cursor-pointer hover:bg-opacity-80`} onClick={() => handleSort('partName')}>
                      <div className="flex items-center gap-2">
                        Part Name
                        {getSortIcon('partName')}
                      </div>
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} cursor-pointer hover:bg-opacity-80`} onClick={() => handleSort('deviceType')}>
                      <div className="flex items-center gap-2">
                        Device
                        {getSortIcon('deviceType')}
                      </div>
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Task
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} cursor-pointer hover:bg-opacity-80`} onClick={() => handleSort('requestedBy')}>
                      <div className="flex items-center gap-2">
                        Requested By
                        {getSortIcon('requestedBy')}
                      </div>
                    </th>
                    {/* <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} cursor-pointer hover:bg-opacity-80`} onClick={() => handleSort('price')}>
                      <div className="flex items-center gap-2">
                        Total Price
                        {getSortIcon('price')}
                      </div>
                    </th> */}
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} cursor-pointer hover:bg-opacity-80`} onClick={() => handleSort('createdAt')}>
                      <div className="flex items-center gap-2">
                        Date
                        {getSortIcon('createdAt')}
                      </div>
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Status
                    </th>
                    {activeTab === 'Pending' && (
                      <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {sortedRequests.map((request, index) => {
                    const statusConfig = {
                      'Pending': {
                        bg: isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-100',
                        text: isDarkMode ? 'text-yellow-300' : 'text-yellow-800',
                        border: isDarkMode ? 'border-yellow-700' : 'border-yellow-300'
                      },
                      'Approved': {
                        bg: isDarkMode ? 'bg-green-900/30' : 'bg-green-100',
                        text: isDarkMode ? 'text-green-300' : 'text-green-800',
                        border: isDarkMode ? 'border-green-700' : 'border-green-300'
                      }
                    };

                    const currentStatus = statusConfig[request.status] || statusConfig['Pending'];

                    return (
                      <tr 
                        key={request._id} 
                        className={`${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors duration-200 ${index % 2 === 0 ? (isDarkMode ? 'bg-gray-800' : 'bg-white') : (isDarkMode ? 'bg-gray-750' : 'bg-gray-50/50')}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                              <FaBox className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            </div>
                            <div>
                              <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {request.part?.name || 'Unknown Part'}
                              </div>
                              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                #{request.ticketNumber}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {request.part?.deviceType?.name || 'N/A'}
                            </div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {request.part?.deviceModel?.name || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} max-w-[150px] truncate`} title={request.taskId?.taskName || 'No task assigned'}>
                              {request.taskId?.taskName || 'No task assigned'}
                            </div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {request.taskId?.priorityLevel || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FaUser className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {request.requestedBy?.name || 'Unknown'}
                            </div>
                          </div>
                        </td>
                        {/* <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FaMoneyBillWave className={`text-xs ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                            <div>
                              <div className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                ₹{(request.part?.price || 0) * (request.quantity || 0)}
                              </div>
                              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                ₹{request.part?.price || 0} x {request.quantity || 0}
                              </div>
                            </div>
                          </div>
                        </td> */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {new Date(request.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}`}>
                            {request.status === 'Pending' && <FaClock className="mr-1" />}
                            {request.status === 'Approved' && <FaCheckCircle className="mr-1" />}
                            {request.status}
                          </span>
                        </td>
                        {activeTab === 'Pending' && (
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => approveRequest(request._id)}
                                className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-xs font-medium rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                              >
                                <FaCheckCircle className="mr-1" size={12} />
                                Approve
                              </button>
                              
                              <button
                                onClick={() => rejectRequest(request._id)}
                                className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-xs font-medium rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                              >
                                <FaExclamationTriangle className="mr-1" size={12} />
                                Reject
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryPartsRequests;