import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import useLoader from '../customHooks/useLoader';
import { useTheme } from '../context/ThemeContext'; // Import the ThemeContext
import { format } from 'date-fns'; // Import date-fns
import useRole from '../customHooks/useRole'; // Import useRole hook
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { FaCheckCircle, FaClock, FaTimesCircle, FaArrowLeft, FaArrowRight, FaTools, FaClipboardList, FaUser, FaDesktop, FaCog, FaExclamationTriangle, FaEdit, FaSave, FaWrench, FaBox, FaSearch, FaFilter, FaTimes, FaTh, FaList, FaPhone, FaMobile, FaTrash, FaExchangeAlt, FaEllipsisV, FaPlus, FaUndo } from 'react-icons/fa'; // Import React Icons
import useUserId from '../customHooks/useUserid';
import { getAuthAxiosConfig } from '../utils/authUtils';

const RepairOrders = () => {
  const userRole = useRole(); // Check if the user is a technician
  const userId = useUserId(); // Get the user ID
  console.log(userRole);
  
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]); // Store all tasks
  const [filteredTasks, setFilteredTasks] = useState([]); // Store filtered tasks
  const [activeTab, setActiveTab] = useState('Pending'); // Default to Pending tab
  const { Loader, showLoader, hideLoader } = useLoader();
  const { isDarkMode } = useTheme(); // Access the current theme
  const navigate = useNavigate(); // Initialize navigate
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 9,
    totalPages: 1,
    totalRecords: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  
  // Search and filter states
  const [searchFilters, setSearchFilters] = useState({
    commonSearch: '',
    ticketNumber: '',
    technicianName: '',
    deviceName: '',
    status: '',
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Modal states for task management
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  
  // Edit task form states
  const [editTaskName, setEditTaskName] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editPriorityLevel, setEditPriorityLevel] = useState('');
  const [editNote, setEditNote] = useState('');
  
  // Delete task states
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteNote, setDeleteNote] = useState('');
  
  // Reassign task states
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [reassignNote, setReassignNote] = useState('');
  const [actionDropdown, setActionDropdown] = useState(null);

  // Return task states
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnNote, setReturnNote] = useState('');
  const [pendingReturnTask, setPendingReturnTask] = useState(null);

  useEffect(() => {
    fetchTickets(pagination.currentPage, pagination.pageSize);
  }, [pagination.currentPage, pagination.pageSize]);

  const fetchTickets = async (page, size) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APIURL}/api/sale-orders?page=${page}&pageSize=${size}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } }
      );
      const data = await response.json();
      if (data.success) {
        setTickets(data.data);
        setPagination({
          currentPage: data.pagination.currentPage,
          pageSize: data.pagination.pageSize,
          totalPages: data.pagination.totalPages,
          totalRecords: data.pagination.totalRecords,
        });
      } else {
        setError(data.message || "Failed to fetch tickets.");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (pagination.currentPage < pagination.totalPages) {
      handlePageChange(pagination.currentPage + 1);
    }
  };

  const handlePrevious = () => {
    if (pagination.currentPage > 1) {
      handlePageChange(pagination.currentPage - 1);
    }
  };

  const fetchTasks = async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const userid = decodedToken['id'];
        showLoader();
        var response = {}
        const authConfig = getAuthAxiosConfig();
        
        if (userRole === 'technician' || decodedToken['role'] === 'technician') {
          response = await axios.get(`${import.meta.env.VITE_APIURL}/api/task/list-tasks?technician=${userid}`, authConfig);
        } else {
          response = await axios.get(`${import.meta.env.VITE_APIURL}/api/task/list-tasks`, authConfig);
        }
        
        setAllTasks(response.data.data); // Store all tasks
        setFilteredTasks(response.data.data); // Initialize filtered tasks
        
        // Apply current search filters first
        const searchFiltered = applyFilters(response.data.data, searchFilters);
        
        // Then apply current active tab filter
        const currentTab = activeTab || 'Pending'; // Default to Pending if activeTab is not set
        const statusFiltered = currentTab === 'All' ? searchFiltered : searchFiltered.filter(task => task.status === currentTab);
        
        // Ensure current page is valid for the filtered results
        const maxPage = Math.ceil(statusFiltered.length / pagination.pageSize) || 1;
        const currentPage = pagination.currentPage > maxPage ? 1 : pagination.currentPage;
        
        // Apply current pagination
        const startIndex = (currentPage - 1) * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        const paginatedTasks = statusFiltered.slice(startIndex, endIndex);
        
        setTasks(paginatedTasks);
        setPagination(prev => ({
          ...prev,
          currentPage: currentPage,
          totalRecords: statusFiltered.length,
          totalPages: Math.ceil(statusFiltered.length / pagination.pageSize) || 1
        }));
        hideLoader();
      } catch (error) {
        console.error('Error fetching tasks:', error);
        hideLoader();
      }
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Fetch technicians for reassignment
  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const authConfig = getAuthAxiosConfig();
        const response = await axios.get(`${import.meta.env.VITE_APIURL}/api/user/list-users?role=technician`, authConfig);
        console.log('Technicians response:', response.data);
        
        if (response.data.status === 'Success' && response.data.data) {
          setTechnicians(response.data.data.map(tech => ({
            id: tech._id,
            name: tech.name,
          })));
        } else if (response.data.success && response.data.data) {
          // Handle alternative response structure
          setTechnicians(response.data.data.map(tech => ({
            id: tech._id,
            name: tech.name,
          })));
        } else {
          console.warn('Unexpected technicians response structure:', response.data);
        }
      } catch (error) {
        console.error('Error fetching technicians:', error);
      }
    };

    fetchTechnicians();
  }, []);
  
  console.log(tasks);
  
  // Search and filter functions
  const applyFilters = (tasksToFilter = allTasks, filters = searchFilters) => {
    let filtered = tasksToFilter;

    // Apply common search
    if (filters.commonSearch) {
      const searchTerm = filters.commonSearch.toLowerCase();
      filtered = filtered.filter(task => 
        task?.taskName?.toLowerCase().includes(searchTerm) ||
        task?.ticketNumber?.toLowerCase().includes(searchTerm) ||
        task?.technician?.name?.toLowerCase().includes(searchTerm) ||
        task?.saleOrder?.deviceBrand?.name?.toLowerCase().includes(searchTerm) ||
        task?.saleOrder?.model?.name?.toLowerCase().includes(searchTerm) ||
        task?.status?.toLowerCase().includes(searchTerm) ||
        task?.priorityLevel?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply specific filters
    if (filters.ticketNumber) {
      filtered = filtered.filter(task => 
        task?.ticketNumber?.toLowerCase().includes(filters.ticketNumber.toLowerCase())
      );
    }

    if (filters.technicianName) {
      filtered = filtered.filter(task => 
        task?.technician?.name?.toLowerCase().includes(filters.technicianName.toLowerCase())
      );
    }

    if (filters.deviceName) {
      filtered = filtered.filter(task => {
        const deviceName = `${task?.saleOrder?.deviceBrand?.name || ''} ${task?.saleOrder?.model?.name || ''}`.toLowerCase();
        return deviceName.includes(filters.deviceName.toLowerCase());
      });
    }

    if (filters.status) {
      filtered = filtered.filter(task => task?.status === filters.status);
    }

    return filtered;
  };

  const handleSearchChange = (field, value) => {
    const newFilters = { ...searchFilters, [field]: value };
    setSearchFilters(newFilters);
    
    // Apply filters and pagination
    const filtered = applyFilters(allTasks, newFilters);
    setFilteredTasks(filtered);
    
    // Apply status filter if activeTab is set
    const statusFiltered = activeTab === 'All' ? filtered : filtered.filter(task => task.status === activeTab);
    
    // Reset to first page when filters change
    const startIndex = 0;
    const endIndex = pagination.pageSize;
    const paginatedTasks = statusFiltered.slice(startIndex, endIndex);
    
    setTasks(paginatedTasks);
    setPagination(prev => ({
      ...prev,
      totalRecords: statusFiltered.length,
      totalPages: Math.ceil(statusFiltered.length / pagination.pageSize),
      currentPage: 1 // Reset to first page when search changes
    }));
  };

  const clearAllFilters = () => {
    setSearchFilters({
      commonSearch: '',
      ticketNumber: '',
      technicianName: '',
      deviceName: '',
      status: '',
    });
    setFilteredTasks(allTasks);
    filterTasksByStatus(activeTab);
  };

  const handlePageChange = (page) => {
    const filtered = applyFilters(allTasks, searchFilters);
    const statusFiltered = activeTab === 'All' ? filtered : filtered.filter(task => task.status === activeTab);
    
    const startIndex = (page - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    const paginatedTasks = statusFiltered.slice(startIndex, endIndex);
    
    setTasks(paginatedTasks);
    setPagination(prev => ({
      ...prev,
      currentPage: page,
      totalRecords: statusFiltered.length,
      totalPages: Math.ceil(statusFiltered.length / pagination.pageSize)
    }));
  };

  const handlePageSizeChange = (newSize) => {
    setPagination(prev => ({
      ...prev,
      pageSize: newSize,
      currentPage: 1
    }));
    
    const filtered = applyFilters(allTasks, searchFilters);
    const statusFiltered = activeTab === 'All' ? filtered : filtered.filter(task => task.status === activeTab);
    const paginatedTasks = statusFiltered.slice(0, newSize);
    
    setTasks(paginatedTasks);
    setPagination(prev => ({
      ...prev,
      totalPages: Math.ceil(statusFiltered.length / newSize)
    }));
  };
  
  // Filter tasks based on active tab
  const filterTasksByStatus = (status) => {
    setActiveTab(status);
    
    // Apply current search filters first
    const searchFiltered = applyFilters(allTasks, searchFilters);
    
    // Then apply status filter
    const statusFiltered = status === 'All' ? searchFiltered : searchFiltered.filter(task => task.status === status);
    
    // Apply pagination
    const startIndex = 0; // Reset to first page
    const endIndex = pagination.pageSize;
    const paginatedTasks = statusFiltered.slice(startIndex, endIndex);
    
    setTasks(paginatedTasks);
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
      totalRecords: statusFiltered.length,
      totalPages: Math.ceil(statusFiltered.length / pagination.pageSize)
    }));
  };

  // Get task counts for each status
  const getTaskCounts = () => {
    const pending = allTasks.filter(task => task.status === 'Pending').length;
    const inProgress = allTasks.filter(task => task.status === 'In Progress').length;
    const completed = allTasks.filter(task => task.status === 'Completed').length;
    const returned = allTasks.filter(task => task.status === 'Return').length;
    return { pending, inProgress, completed, returned };
  };

  const taskCounts = getTaskCounts();

  const updateTask = async (taskId, updatedData) => {
    try {
      showLoader();
       const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) return;
      const response = await axios.put(`${import.meta.env.VITE_APIURL}/api/task/update-task/${taskId}`,
        {...updatedData, userId: userId}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      console.log('Task updated:', response.data);
      alert(response.data.message);
      // Refresh tasks after update
      const updatedTasks = allTasks.map((task) => (task._id === taskId ? { ...task, ...updatedData } : task));
      setAllTasks(updatedTasks);
      // Re-filter tasks based on current active tab
      const filteredTasks = updatedTasks.filter(task => task.status === activeTab);
      setTasks(filteredTasks);
      hideLoader();
    } catch (error) {
      console.error('Error updating task:', error);
      if (error.response?.status === 401) {
        alert('Authentication failed. Please login again.');
      } else {
        alert('Failed to update task.');
      }
      hideLoader();
    }
  };

  // Handle Edit Task
  const handleEditTask = (task) => {
    setSelectedTask(task);
    setEditTaskName(task.taskName || '');
    setEditTaskDescription(task.taskDescription || '');
    setEditPriorityLevel(task.priorityLevel || 'Low');
    setEditNote(task.note || '');
    setShowEditModal(true);
    setActionDropdown(null);
  };

  const handleEditConfirm = async () => {
    if (!editTaskName.trim()) {
      alert('Task name is required.');
      return;
    }

    try {
      showLoader();
      const authConfig = getAuthAxiosConfig();
      const updatedData = {
        taskName: editTaskName,
        taskDescription: editTaskDescription,
        priorityLevel: editPriorityLevel,
        note: `${editNote}\n[EDITED] Task updated - ${new Date().toLocaleString()}`,
      };

      const response = await axios.put(`${import.meta.env.VITE_APIURL}/api/task/update-task/${selectedTask._id}`, updatedData, authConfig);
      
      if (response.data.statusCode === 200) {
        alert('Task updated successfully');
        setShowEditModal(false);
        resetEditForm();
        
        // Refresh all tasks from server
        await fetchTasks();
      } else {
        alert('Failed to update task: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task: ' + (error.response?.data?.message || error.message));
    } finally {
      hideLoader();
    }
  };

  // Handle Delete Task
  const handleDeleteTask = (task) => {
    setSelectedTask(task);
    setShowDeleteModal(true);
    setActionDropdown(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteReason || !deleteNote.trim()) {
      alert('Please provide a reason and note for deletion.');
      return;
    }

    try {
      showLoader();
      const authConfig = getAuthAxiosConfig();
      const response = await axios.delete(`${import.meta.env.VITE_APIURL}/api/task/delete-task/${selectedTask._id}`, {
        ...authConfig,
        data: {
          reason: deleteReason,
          note: deleteNote,
          deletedAt: new Date().toISOString(),
        }
      });

      if (response.data.statusCode === 200) {
        alert('Task deleted successfully');
        setShowDeleteModal(false);
        resetDeleteForm();
        
        // Refresh all tasks from server
        await fetchTasks();
      } else {
        alert('Failed to delete task: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task: ' + (error.response?.data?.message || error.message));
    } finally {
      hideLoader();
    }
  };

  // Handle Reassign Task
  const handleReassignTask = (task) => {
    console.log('Reassigning task:', task);
    console.log('Available technicians:', technicians);
    setSelectedTask(task);
    setShowReassignModal(true);
    setActionDropdown(null);
  };

  const handleReassignConfirm = async () => {
    if (!selectedTechnician || !reassignNote.trim()) {
      alert('Please select a technician and provide a reassignment note.');
      return;
    }

    console.log('Reassigning task to technician:', selectedTechnician);
    console.log('Reassignment note:', reassignNote);

    try {
      showLoader();
      const authConfig = getAuthAxiosConfig();
      
      const updatedData = {
        
        technician: selectedTechnician,
        note: `${selectedTask.note || ''}\n[REASSIGNED] ${reassignNote} - ${new Date().toLocaleString()}`,
        status: 'Pending', // Reset status when reassigning
      };

      console.log('Sending update data:', updatedData);

      const response = await axios.put(`${import.meta.env.VITE_APIURL}/api/task/update-task/${selectedTask._id}`, updatedData, authConfig);
      
      console.log('Reassignment response:', response.data);

      if (response.data.statusCode === 200) {
        alert('Task reassigned successfully');
        setShowReassignModal(false);
        resetReassignForm();
        
        // Refresh all tasks from server to get updated technician data
        await fetchTasks();
      } else {
        alert('Failed to reassign task: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error reassigning task:', error);
      alert('Failed to reassign task: ' + (error.response?.data?.message || error.message));
    } finally {
      hideLoader();
    }
  };

  // Reset form functions
  const resetEditForm = () => {
    setEditTaskName('');
    setEditTaskDescription('');
    setEditPriorityLevel('Low');
    setEditNote('');
    setSelectedTask(null);
  };

  const resetDeleteForm = () => {
    setDeleteReason('');
    setDeleteNote('');
    setSelectedTask(null);
  };

  const resetReassignForm = () => {
    setSelectedTechnician('');
    setReassignNote('');
    setSelectedTask(null);
  };

  const resetReturnForm = () => {
    setReturnReason('');
    setReturnNote('');
    setPendingReturnTask(null);
  };

  // Handle Return Task
  const handleReturnConfirm = async () => {
    if (!returnReason) {
      alert('Please select a reason for return.');
      return;
    }

    if (!returnNote.trim()) {
      alert('Please provide additional details for the return.');
      return;
    }

    try {
      showLoader();
      const updatedData = {
        note: pendingReturnTask?.note ? `${pendingReturnTask.note}\n\nReturn Reason: ${returnReason}\nReturn Details: ${returnNote}` : `Return Reason: ${returnReason}\nReturn Details: ${returnNote}`,
        status: 'Return',
        returnReason: returnReason,
        returnNote: returnNote,
      };
      
      await updateTask(pendingReturnTask.taskId, updatedData);
      setShowReturnModal(false);
      resetReturnForm();
    } catch (error) {
      console.error('Error updating task to return:', error);
      alert('Failed to update task.');
    } finally {
      hideLoader();
    }
  };

  const handleReturnCancel = () => {
    setShowReturnModal(false);
    resetReturnForm();
  };

  // Handle modal cancellations
  const handleEditCancel = () => {
    setShowEditModal(false);
    resetEditForm();
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    resetDeleteForm();
  };

  const handleReassignCancel = () => {
    setShowReassignModal(false);
    resetReassignForm();
  };

  return (
    <div className={`min-h-screen p-4 sm:p-6 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
      <Loader />
      
      {/* Modern Header */}
      <div className={`mb-8 p-6 rounded-2xl ${isDarkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-700' : 'bg-gradient-to-r from-white to-gray-50 border border-gray-200'} shadow-xl`}>
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${isDarkMode ? 'from-blue-600 to-blue-700 shadow-blue-500/25' : 'from-blue-100 to-blue-200 shadow-blue-200/50'} shadow-xl`}>
            <FaTools className={`text-2xl ${isDarkMode ? 'text-white' : 'text-blue-600'}`} />
          </div>
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              My Repair Tasks
            </h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage your assigned repair tasks and update progress ({allTasks.length} total tasks)
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className={`mb-6 p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/80 border border-gray-200'} shadow-lg`}>
        {/* Quick Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchFilters.commonSearch}
              onChange={(e) => handleSearchChange('commonSearch', e.target.value)}
              className={`block w-full pl-10 pr-3 py-3 text-lg border-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
              }`}
              placeholder="🔍 Search by ticket number, technician, device, or status..."
            />
            {searchFilters.commonSearch && (
              <button
                onClick={() => handleSearchChange('commonSearch', '')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <FaTimes className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              isDarkMode 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FaFilter size={12} />
            Advanced Filters
            <span className={`transform transition-transform duration-200 ${showAdvancedFilters ? 'rotate-180' : ''}`}>
              ↓
            </span>
          </button>
          
          {(searchFilters.ticketNumber || searchFilters.technicianName || searchFilters.deviceName || searchFilters.status || searchFilters.commonSearch) && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors duration-200"
            >
              <FaTimes size={12} />
              Clear All Filters
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Ticket Number Filter */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Ticket Number
                </label>
                <input
                  type="text"
                  value={searchFilters.ticketNumber}
                  onChange={(e) => handleSearchChange('ticketNumber', e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="Enter ticket number..."
                />
              </div>

              {/* Technician Name Filter */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Technician Name
                </label>
                <input
                  type="text"
                  value={searchFilters.technicianName}
                  onChange={(e) => handleSearchChange('technicianName', e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="Enter technician name..."
                />
              </div>

              {/* Device Name Filter */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Device Name
                </label>
                <input
                  type="text"
                  value={searchFilters.deviceName}
                  onChange={(e) => handleSearchChange('deviceName', e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="Enter device name..."
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Status
                </label>
                <select
                  value={searchFilters.status}
                  onChange={(e) => handleSearchChange('status', e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-200 text-gray-900'
                  }`}
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Return">Return</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Tabs and View Switcher */}
      <div className="flex justify-between items-center">
        <div className={`mb-6 p-2 rounded-2xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/80 border border-gray-200'} shadow-lg`}>
          <div className="flex flex-wrap gap-2">
            {[
              { status: 'Pending', count: taskCounts.pending, icon: FaClock, color: 'yellow' },
              { status: 'In Progress', count: taskCounts.inProgress, icon: FaCog, color: 'blue' },
              { status: 'Completed', count: taskCounts.completed, icon: FaCheckCircle, color: 'green' },
              { status: 'Return', count: taskCounts.returned, icon: FaUndo, color: 'red' }
            ].map(({ status, count, icon: Icon, color }) => (
              <button
                key={status}
                onClick={() => filterTasksByStatus(status)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 text-sm ${
                  activeTab === status
                    ? `${
                        color === 'yellow'
                          ? isDarkMode
                            ? 'bg-yellow-600/20 text-yellow-300 border border-yellow-700'
                            : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                          : color === 'blue'
                          ? isDarkMode
                            ? 'bg-blue-600/20 text-blue-300 border border-blue-700'
                            : 'bg-blue-100 text-blue-700 border border-blue-300'
                          : color === 'green'
                          ? isDarkMode
                            ? 'bg-green-600/20 text-green-300 border border-green-700'
                            : 'bg-green-100 text-green-700 border border-green-300'
                          : isDarkMode
                          ? 'bg-red-600/20 text-red-300 border border-red-700'
                          : 'bg-red-100 text-red-700 border border-red-300'
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
                      : color === 'blue'
                      ? isDarkMode ? 'bg-blue-700 text-blue-200' : 'bg-blue-200 text-blue-800'
                      : color === 'green'
                      ? isDarkMode ? 'bg-green-700 text-green-200' : 'bg-green-200 text-green-800'
                      : isDarkMode ? 'bg-red-700 text-red-200' : 'bg-red-200 text-red-800'
                    : isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
        
        {/* View Mode Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-3 rounded-xl transition-all duration-300 ${
              viewMode === 'grid'
                ? `bg-blue-600 text-white shadow-lg`
                : `${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
            }`}
            aria-label="Grid View"
          >
            <FaTh />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-3 rounded-xl transition-all duration-300 ${
              viewMode === 'table'
                ? `bg-blue-600 text-white shadow-lg`
                : `${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
            }`}
            aria-label="Table View"
          >
            <FaList />
          </button>
        </div>
      </div>

      {/* Tasks Content */}
      {tasks.length === 0 ? (
        <div className={`p-12 rounded-2xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'} shadow-lg text-center`}>
          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <FaClipboardList className={`text-2xl ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            No {activeTab} Tasks
          </h3>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            You don't have any {activeTab.toLowerCase()} tasks at the moment.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">{/* Grid view content */}
          {tasks.map((task) => {
            const statusConfig = {
              "Pending": {
                bg: isDarkMode ? "from-yellow-900/50 to-yellow-800/50" : "from-yellow-50 to-yellow-100",
                border: isDarkMode ? "border-yellow-700" : "border-yellow-300",
                icon: FaClock,
                iconColor: isDarkMode ? "text-yellow-400" : "text-yellow-600"
              },
              "In Progress": {
                bg: isDarkMode ? "from-blue-900/50 to-blue-800/50" : "from-blue-50 to-blue-100",
                border: isDarkMode ? "border-blue-700" : "border-blue-300",
                icon: FaCog,
                iconColor: isDarkMode ? "text-blue-400" : "text-blue-600"
              },
              "Completed": {
                bg: isDarkMode ? "from-green-900/50 to-green-800/50" : "from-green-50 to-green-100",
                border: isDarkMode ? "border-green-700" : "border-green-300",
                icon: FaCheckCircle,
                iconColor: isDarkMode ? "text-green-400" : "text-green-600"
              },
              "Return": {
                bg: isDarkMode ? "from-red-900/50 to-red-800/50" : "from-red-50 to-red-100",
                border: isDarkMode ? "border-red-700" : "border-red-300",
                icon: FaUndo,
                iconColor: isDarkMode ? "text-red-400" : "text-red-600"
              }
            };

            const priorityConfig = {
              "Low": {
                bg: isDarkMode ? "bg-yellow-800/20" : "bg-yellow-100",
                text: isDarkMode ? "text-yellow-300" : "text-yellow-700",
                border: isDarkMode ? "border-yellow-700" : "border-yellow-300"
              },
              "Medium": {
                bg: isDarkMode ? "bg-orange-800/20" : "bg-orange-100",
                text: isDarkMode ? "text-orange-300" : "text-orange-700",
                border: isDarkMode ? "border-orange-700" : "border-orange-300"
              },
              "High": {
                bg: isDarkMode ? "bg-red-800/20" : "bg-red-100",
                text: isDarkMode ? "text-red-300" : "text-red-700",
                border: isDarkMode ? "border-red-700" : "border-red-300"
              }
            };

            const currentStatus = statusConfig[task.status] || statusConfig["Pending"];
            const currentPriority = priorityConfig[task.priorityLevel] || priorityConfig["Low"];
            const StatusIcon = currentStatus.icon;

            return (
              <div
                key={task._id}
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
                        <h2 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate max-w-[180px]`} title={task?.taskName?.toString().toUpperCase() || 'UNNAMED TASK'}>
                          {task?.taskName?.toString().toUpperCase() || 'UNNAMED TASK'}
                        </h2>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          #{task?.ticketNumber || 'No Ticket'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${currentPriority.bg} ${currentPriority.text} ${currentPriority.border}`}>
                        {task.priorityLevel || 'Low'} Priority
                      </span>
                      
                      {/* Actions Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setActionDropdown(actionDropdown === task._id ? null : task._id)}
                          className={`p-2 rounded-lg transition-colors duration-150 ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/50'
                          }`}
                        >
                          <FaEllipsisV size={14} />
                        </button>

                        {/* Dropdown Menu */}
                        {actionDropdown === task._id && (
                          <>
                            {/* Backdrop */}
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setActionDropdown(null)}
                            ></div>
                            
                            {/* Dropdown Content */}
                            <div className={`absolute right-0 top-full mt-1 w-48 rounded-lg shadow-lg z-20 border ${
                              isDarkMode 
                                ? 'bg-gray-800 border-gray-700' 
                                : 'bg-white border-gray-200'
                            }`}>
                              <div className="py-1">
                                <button
                                  onClick={() => handleEditTask(task)}
                                  className={`flex items-center w-full px-4 py-2 text-sm transition-colors duration-150 ${
                                    isDarkMode 
                                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                  }`}
                                >
                                  <FaEdit className="mr-3 h-4 w-4" />
                                  Edit Task
                                </button>
                                
                                <button
                                  onClick={() => handleReassignTask(task)}
                                  className={`flex items-center w-full px-4 py-2 text-sm transition-colors duration-150 ${
                                    isDarkMode 
                                      ? 'text-gray-300 hover:bg-blue-900/20 hover:text-blue-400'
                                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                                  }`}
                                >
                                  <FaExchangeAlt className="mr-3 h-4 w-4" />
                                  Reassign Task
                                </button>
                                
                                <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
                                
                                <button
                                  onClick={() => handleDeleteTask(task)}
                                  className={`flex items-center w-full px-4 py-2 text-sm transition-colors duration-150 ${
                                    isDarkMode 
                                      ? 'text-red-400 hover:bg-red-900/20 hover:text-red-300'
                                      : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                                  }`}
                                >
                                  <FaTrash className="mr-3 h-4 w-4" />
                                  Delete Task
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 space-y-4 flex-grow">
                  {/* Technician Info */}
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-600/20' : 'bg-purple-100'}`}>
                      <FaUser className={`${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} size={14} />
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Technician</p>
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {task?.technician?.name || 'Not Assigned'}
                      </p>
                    </div>
                  </div>

                  {/* Device Info */}
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-indigo-600/20' : 'bg-indigo-100'}`}>
                      <FaDesktop className={`${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} size={14} />
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Device</p>
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {task?.saleOrder?.model?.name || ''}
                        {/* {task.saleOrder?.deviceBrand?.name || 'Unknown Device'} {task?.saleOrder?.model?.name || ''} */}

                        {task?.saleOrder?.color ? ` (${task?.saleOrder?.color})` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {task?.taskDescription && (
                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                      <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Description</p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {task.taskDescription}
                      </p>
                    </div>
                  )}

                  {/* Task Date */}
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Created: {task.createdAt ? format(new Date(task.createdAt), 'MMM dd, yyyy hh:mm a') : 'Unknown'}
                  </div>

                  {/* Request Parts Button */}
                  <button
                    onClick={() =>
                      navigate(`/technician/request-part`, {
                        state: {
                          taskId: task._id,
                          ticketId: task.ticketNumber,
                          parts: task.parts,
                        },
                      })
                    }
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm"
                  >
                    <FaBox className="mr-2" size={14} />
                    Request Parts
                  </button>

                  {/* Parts List */}
                  {task.parts && task.parts.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <FaWrench className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} size={14} />
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Requested Parts ({task.parts.length})
                        </p>
                      </div>
                      
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {task.parts.map((item) => {
                          const partStatusConfig = {
                            "Approved": {
                              bg: isDarkMode ? "bg-green-800/20" : "bg-green-100",
                              border: isDarkMode ? "border-green-700" : "border-green-300",
                              icon: FaCheckCircle,
                              iconColor: "text-green-500"
                            },
                            "Pending": {
                              bg: isDarkMode ? "bg-yellow-800/20" : "bg-yellow-100",
                              border: isDarkMode ? "border-yellow-700" : "border-yellow-300",
                              icon: FaClock,
                              iconColor: "text-yellow-500"
                            },
                            "Rejected": {
                              bg: isDarkMode ? "bg-red-800/20" : "bg-red-100",
                              border: isDarkMode ? "border-red-700" : "border-red-300",
                              icon: FaTimesCircle,
                              iconColor: "text-red-500"
                            }
                          };

                          const partStatus = partStatusConfig[item.orderStatus] || partStatusConfig["Pending"];
                          const PartIcon = partStatus.icon;

                          return (
                            <div
                              key={item._id}
                              className={`p-3 rounded-lg border ${partStatus.bg} ${partStatus.border}`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <PartIcon className={partStatus.iconColor} size={12} />
                                <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {item.partId?.name || 'Unknown Part'}
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Type:</span>
                                  <span className={`ml-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {item.partType?.type || 'N/A'}
                                  </span>
                                </div>
                                <div>
                                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Qty:</span>
                                  <span className={`ml-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {item.quantity || 0}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-1">
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status:</span>
                                <span className={`ml-1 text-xs font-medium ${partStatus.iconColor}`}>
                                  {item.orderStatus || 'Pending'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Update Form */}
                <div className={`mt-auto p-6 border-t ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'} bg-gradient-to-r ${isDarkMode ? 'from-gray-800/50 to-gray-700/50' : 'from-gray-50/50 to-white/50'}`}>
                  <form
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      const status = formData.get("status");
                      const note = formData.get("note");
                      
                      // If Return status is selected, show the return modal
                      if (status === 'Return') {
                        setPendingReturnTask({ taskId: task._id, note });
                        setShowReturnModal(true);
                        return;
                      }
                      
                      const updatedData = {
                        note: note,
                        status: status,
                      };
                      updateTask(task._id, updatedData);
                    }}
                  >
                    <div>
                      <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <FaEdit size={12} />
                        Update Notes
                      </label>
                      <textarea
                        name="note"
                        defaultValue={task.note}
                        className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 text-sm ${
                          isDarkMode
                            ? 'bg-gray-700/50 text-white border-gray-600 focus:ring-blue-500/50 placeholder-gray-400'
                            : 'bg-white text-gray-800 border-gray-300 focus:ring-blue-500/50 placeholder-gray-500'
                        }`}
                        rows="2"
                        placeholder="Add your notes here..."
                      />
                    </div>
                    
                    <div>
                      <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <FaCog size={12} />
                        Update Status
                      </label>
                      <select
                        name="status"
                        defaultValue={task.status}
                        className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 text-sm ${
                          isDarkMode
                            ? 'bg-gray-700/50 text-white border-gray-600 focus:ring-blue-500/50'
                            : 'bg-white text-gray-800 border-gray-300 focus:ring-blue-500/50'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Return">Return</option>
                      </select>
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm"
                    >
                      <FaSave className="mr-2" size={14} />
                      Update Task
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className={`overflow-x-auto rounded-2xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/80 border border-gray-200'} shadow-lg`}>
          <table className={`w-full text-sm text-left ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <thead className={`text-xs uppercase ${isDarkMode ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-50 text-gray-700'}`}>
              <tr>
                <th scope="col" className="px-6 py-3">Task</th>
                <th scope="col" className="px-6 py-3">Technician</th>
                <th scope="col" className="px-6 py-3">Device</th>
                <th scope="col" className="px-6 py-3">Priority</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Created At</th>
                <th scope="col" className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task._id} className={`border-b ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-600/50' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                  <td className="px-6 py-4 font-medium whitespace-nowrap">
                    <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{task?.taskName?.toString().toUpperCase() || 'UNNAMED TASK'}</div>
                    <div className="text-xs">#{task?.ticketNumber || 'No Ticket'}</div>
                  </td>
                  <td className="px-6 py-4">{task?.technician?.name || 'Not Assigned'}</td>
                  <td className="px-6 py-4">
                    {task?.saleOrder?.model?.name || ''}
                    {/* {task.saleOrder?.deviceBrand?.name || 'Unknown Device'} {task?.saleOrder?.model?.name || ''} */}
                    {task?.saleOrder?.color ? ` (${task?.saleOrder?.color})` : ''}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      task.priorityLevel === 'High' ? (isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800') :
                      task.priorityLevel === 'Medium' ? (isDarkMode ? 'bg-orange-900 text-orange-300' : 'bg-orange-100 text-orange-800') :
                      (isDarkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800')
                    }`}>
                      {task.priorityLevel || 'Low'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      task.status === 'Completed' ? (isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800') :
                      task.status === 'In Progress' ? (isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800') :
                      task.status === 'Return' ? (isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800') :
                      (isDarkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800')
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{task.createdAt ? format(new Date(task.createdAt), 'MMM dd, yyyy') : 'Unknown'}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() =>
                        navigate(`/technician/request-part`, {
                          state: {
                            taskId: task._id,
                            ticketId: task.ticketNumber,
                            parts: task.parts,
                          },
                        })
                      }
                      className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                    >
                      Request Parts
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className={`mt-6 p-4 rounded-2xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/80 border border-gray-200'} shadow-lg`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalRecords)} of {pagination.totalRecords} results
              </div>
              <div className="flex items-center gap-2">
                <label className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Show:
                </label>
                <select
                  value={pagination.pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className={`px-3 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-200 text-gray-900'
                  }`}
                >
                  <option value={6}>6</option>
                  <option value={9}>9</option>
                  <option value={12}>12</option>
                  <option value={18}>18</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevious}
                disabled={pagination.currentPage === 1}
                className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                  pagination.currentPage === 1
                    ? `${isDarkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`
                    : `${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                }`}
              >
                <FaArrowLeft size={12} />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                        pagination.currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : `${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={handleNext}
                disabled={pagination.currentPage === pagination.totalPages}
                className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                  pagination.currentPage === pagination.totalPages
                    ? `${isDarkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`
                    : `${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                }`}
              >
                <FaArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={handleEditCancel}
          ></div>
          
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className={`relative rounded-xl shadow-2xl max-w-md w-full ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className={`flex items-center justify-between p-6 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h2 className={`text-xl font-semibold flex items-center ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  <FaEdit className="mr-2" />
                  Edit Task
                </h2>
                <button
                  onClick={handleEditCancel}
                  className={`p-2 rounded-lg transition-colors duration-150 ${
                    isDarkMode 
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FaTimes size={16} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Task Name *
                  </label>
                  <input
                    type="text"
                    value={editTaskName}
                    onChange={(e) => setEditTaskName(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter task name..."
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Description
                  </label>
                  <textarea
                    value={editTaskDescription}
                    onChange={(e) => setEditTaskDescription(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    rows="3"
                    placeholder="Enter task description..."
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Priority Level
                  </label>
                  <select
                    value={editPriorityLevel}
                    onChange={(e) => setEditPriorityLevel(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Notes
                  </label>
                  <textarea
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    rows="3"
                    placeholder="Add notes..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={handleEditCancel}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                      isDarkMode 
                        ? 'text-gray-300 bg-gray-600 hover:bg-gray-500'
                        : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditConfirm}
                    disabled={!editTaskName.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors duration-150"
                  >
                    Update Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Task Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={handleDeleteCancel}
          ></div>
          
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className={`relative rounded-xl shadow-2xl max-w-md w-full ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className={`flex items-center justify-between p-6 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h2 className={`text-xl font-semibold flex items-center ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`}>
                  <FaTrash className="mr-2" />
                  Delete Task
                </h2>
                <button
                  onClick={handleDeleteCancel}
                  className={`p-2 rounded-lg transition-colors duration-150 ${
                    isDarkMode 
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FaTimes size={16} />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Are you sure you want to delete this task? This action cannot be undone.
                  </p>
                  {selectedTask && (
                    <div className={`p-3 rounded-lg mb-4 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <p className="text-sm"><strong>Task:</strong> {selectedTask.taskName}</p>
                      <p className="text-sm"><strong>Ticket #:</strong> {selectedTask.ticketNumber}</p>
                      <p className="text-sm"><strong>Status:</strong> {selectedTask.status}</p>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Reason for Deletion *
                  </label>
                  <select
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="task_completed_elsewhere">Task Completed Elsewhere</option>
                    <option value="duplicate_task">Duplicate Task</option>
                    <option value="customer_cancelled">Customer Cancelled</option>
                    <option value="technical_issue">Technical Issue</option>
                    <option value="parts_unavailable">Parts Unavailable</option>
                    <option value="incorrect_diagnosis">Incorrect Diagnosis</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Additional Notes *
                  </label>
                  <textarea
                    value={deleteNote}
                    onChange={(e) => setDeleteNote(e.target.value)}
                    placeholder="Please provide additional details about the deletion..."
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    rows="3"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleDeleteCancel}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                      isDarkMode 
                        ? 'text-gray-300 bg-gray-600 hover:bg-gray-500'
                        : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={!deleteReason || !deleteNote.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors duration-150"
                  >
                    Delete Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Task Modal */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={handleReassignCancel}
          ></div>
          
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className={`relative rounded-xl shadow-2xl max-w-md w-full ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className={`flex items-center justify-between p-6 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h2 className={`text-xl font-semibold flex items-center ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  <FaExchangeAlt className="mr-2" />
                  Reassign Task
                </h2>
                <button
                  onClick={handleReassignCancel}
                  className={`p-2 rounded-lg transition-colors duration-150 ${
                    isDarkMode 
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FaTimes size={16} />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Reassign this task to a different technician.
                  </p>
                  {selectedTask && (
                    <div className={`p-3 rounded-lg mb-4 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <p className="text-sm"><strong>Task:</strong> {selectedTask.taskName}</p>
                      <p className="text-sm"><strong>Ticket #:</strong> {selectedTask.ticketNumber}</p>
                      <p className="text-sm"><strong>Current Technician:</strong> {selectedTask.technician?.name || 'Not Assigned'}</p>
                      <p className="text-sm"><strong>Status:</strong> {selectedTask.status}</p>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Assign to Technician *
                  </label>
                  <select
                    value={selectedTechnician}
                    onChange={(e) => setSelectedTechnician(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    required
                  >
                    <option value="">Select a technician</option>
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Reassignment Reason *
                  </label>
                  <textarea
                    value={reassignNote}
                    onChange={(e) => setReassignNote(e.target.value)}
                    placeholder="Please provide the reason for reassignment..."
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    rows="3"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleReassignCancel}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                      isDarkMode 
                        ? 'text-gray-300 bg-gray-600 hover:bg-gray-500'
                        : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReassignConfirm}
                    disabled={!selectedTechnician || !reassignNote.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors duration-150"
                  >
                    Reassign Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Task Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={handleReturnCancel}
          ></div>
          
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className={`relative rounded-xl shadow-2xl max-w-md w-full ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className={`flex items-center justify-between p-6 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h2 className={`text-xl font-semibold flex items-center ${
                  isDarkMode ? 'text-orange-400' : 'text-orange-600'
                }`}>
                  <FaUndo className="mr-2" />
                  Return Task
                </h2>
                <button
                  onClick={handleReturnCancel}
                  className={`p-2 rounded-lg transition-colors duration-150 ${
                    isDarkMode 
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FaTimes size={16} />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Please provide a reason for returning this task. This information will be recorded for tracking purposes.
                  </p>
                </div>

                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Reason for Return *
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="parts_not_available">Parts Not Available</option>
                    <option value="wrong_diagnosis">Wrong Diagnosis</option>
                    <option value="customer_request">Customer Request</option>
                    <option value="device_not_repairable">Device Not Repairable</option>
                    <option value="need_more_information">Need More Information</option>
                    <option value="technician_unavailable">Technician Unavailable</option>
                    <option value="quality_issue">Quality Issue</option>
                    <option value="warranty_claim">Warranty Claim</option>
                    <option value="cost_too_high">Cost Too High for Customer</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Additional Details *
                  </label>
                  <textarea
                    value={returnNote}
                    onChange={(e) => setReturnNote(e.target.value)}
                    placeholder="Please provide additional details about the return..."
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    rows="4"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleReturnCancel}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                      isDarkMode 
                        ? 'text-gray-300 bg-gray-600 hover:bg-gray-500'
                        : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReturnConfirm}
                    disabled={!returnReason || !returnNote.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors duration-150"
                  >
                    Submit Return
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairOrders;