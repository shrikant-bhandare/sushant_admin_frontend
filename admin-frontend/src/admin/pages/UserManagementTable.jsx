
import { useState, useEffect, useCallback } from 'react';
import { FaArrowLeft, FaArrowRight, FaEdit, FaTrash, FaSearch, FaPlus } from 'react-icons/fa';
import EditUser from '../../components/users/EditUser';



const UserManagementTable = ({ 
  users = [], 
  pagination = {}, 
  onPageChange, 
  onPageSizeChange,
  onUpdateUser,
  onDeleteUser,
  onCreateUser
}) => {
  const {
    currentPage = 1,
    pageSize = 10,
    totalPages = 1,
    totalRecords = 0,
  } = pagination;

  const [filteredUsers, setFilteredUsers] = useState(users);
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    role: ''
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'receptionist'
  });

  // Filter users based on search criteria
  useEffect(() => {
    let filtered = users;
    
    if (filters.name) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }
    
    if (filters.email) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(filters.email.toLowerCase())
      );
    }
    
    if (filters.role) {
      filtered = filtered.filter(user => 
        user.role.toLowerCase().includes(filters.role.toLowerCase())
      );
    }
    
    setFilteredUsers(filtered);
  }, [filters, users]);

  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const handlePageSizeChange = (event) => {
    onPageSizeChange(Number(event.target.value));
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      name: '',
      email: '',
      role: ''
    });
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setShowEditModal(true);
  };

  const handleDelete = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      onDeleteUser(userId);
    }
  };

  const handleCreateUser = () => {
    setFormData({
      name: '',
      email: '',
      role: 'receptionist'
    });
    setShowCreateModal(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (showEditModal) {
      onUpdateUser(editingUser._id, formData);
      setShowEditModal(false);
    } else {
      onCreateUser(formData);
      setShowCreateModal(false);
    }
  };

  const handleFormChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const getRoleBadgeColor = (role) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'receptionist':
        return 'bg-green-100 text-green-800';
      case 'sales-manager':
        return 'bg-purple-100 text-purple-800';
      case 'inventory-manager':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // ...existing code...

  return (
    <div className="overflow-x-auto">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
        <button
          onClick={handleCreateUser}
          className="flex items-center px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          <FaPlus className="mr-2" />
          Create User
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <FaSearch className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by name..."
              value={filters.name}
              onChange={(e) => handleFilterChange('name', e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search by email..."
              value={filters.email}
              onChange={(e) => handleFilterChange('email', e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="receptionist">Receptionist</option>
            </select>
          </div>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
        <table className="min-w-full bg-white dark:bg-gray-800">
          <thead className="sticky top-0 bg-white dark:bg-gray-800 z-[10]">
            <tr>
              <th className="py-3 px-4 border-b text-left font-semibold text-gray-900 dark:text-white">Name</th>
              <th className="py-3 px-4 border-b text-left font-semibold text-gray-900 dark:text-white">Email</th>
              <th className="py-3 px-4 border-b text-left font-semibold text-gray-900 dark:text-white">Role</th>
              <th className="py-3 px-4 border-b text-left font-semibold text-gray-900 dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user._id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                <td className="py-3 px-4 border-b text-gray-900 dark:text-white">
                  {user.name
                    .toLowerCase()
                    .split(" ")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </td>
                <td className="py-3 px-4 border-b text-gray-900 dark:text-white">{user.email}</td>
                <td className="py-3 px-4 border-b">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>
                <td className="py-3 px-4 border-b">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
                      title="Edit User"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(user._id)}
                      className="p-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center"
                      title="Delete User"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 gap-4 flex flex-col sm:flex-row justify-between items-center">
        <div className="flex w-full items-center justify-between md:justify-start">
          <label htmlFor="pageSize" className="mr-2 text-gray-900 dark:text-white">Rows per page:</label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={handlePageSizeChange}
            className="p-2 border rounded bg-white dark:bg-gray-800 text-black dark:text-white"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
          </select>
        </div>
        <div className="flex items-center justify-between sm:justify-end w-full">
          <button
            onClick={handlePrevious}
            className="p-2 border rounded flex items-center text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            disabled={currentPage === 1}
          >
            <FaArrowLeft className="mr-2" /> 
          </button>
          <span className="mx-2 text-gray-900 dark:text-white">
            Page {currentPage} of {totalPages} ({totalRecords} records)
          </span>
          <button
            onClick={handleNext}
            className="p-2 border rounded flex items-center text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            disabled={currentPage === totalPages}
          >
            <FaArrowRight className="ml-2" />
          </button>
        </div>
      </div>

      {/* Create User Modal */}
      <EditUser
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User"
      >
        <form onSubmit={handleFormSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleFormChange('email', e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleFormChange('password', e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleFormChange('role', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="receptionist">Receptionist</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
              <option value="customer">Customer</option>
              <option value="technician">Technician</option>
              <option value="diagnostic-technician">Diagnostic-Technician</option>
              <option value="inventory-manager">Inventory-Manager</option>
              <option value="sales-manager">Sales-Manager</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Create User
            </button>
          </div>
        </form>
      </EditUser>

      {/* Edit User Modal */}
      <EditUser
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit User"
      >
        <form onSubmit={handleFormSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleFormChange('email', e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleFormChange('role', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="receptionist">Receptionist</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Update User
            </button>
          </div>
        </form>
      </EditUser>
    </div>
  );
};

export default UserManagementTable;