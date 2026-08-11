import React, { useEffect, useState } from 'react'
import UserManagementTable from './UserManagementTable';
import axios from 'axios';
import { getAuthAxiosConfig } from '../../utils/authUtils';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [pagination, setPagination] = useState({
        currentPage: 1,
        pageSize: 10,
        totalPages: 1,
        totalRecords: 0
    });

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log("import.meta.env.VITE_APIURL => ", import.meta.env.VITE_APIURL);
            
            const response = await axios.get(`${import.meta.env.VITE_APIURL}/api/user/list-users`, getAuthAxiosConfig());
            console.log("response => ", response);
            
            if (response.data && response.data.status === "Success") {
                const userData = response.data.data;
                setUsers(userData);
                
                // Update pagination with actual data
                setPagination(prev => ({
                    ...prev,
                    totalRecords: userData.length,
                    totalPages: Math.ceil(userData.length / prev.pageSize)
                }));
            } else {
                setError('Failed to fetch users');
            }
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Error fetching users: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    };

    const handlePageSizeChange = (size) => {
        setPagination(prev => ({ 
            ...prev, 
            pageSize: size, 
            currentPage: 1,
            totalPages: Math.ceil(users.length / size)
        }));
    };

    const handleUpdateUser = async (userId, userData) => {
        try {
            // Make API call to update user
            const authConfig = getAuthAxiosConfig();
            const response = await axios.put(`${import.meta.env.VITE_APIURL}/api/user/update-user/${userId}`, userData, authConfig);
            
            if (response.data && response.data.status === "Success") {
                // Update local state
                setUsers(prev => prev.map(user => 
                    user._id === userId ? { ...user, ...userData } : user
                ));
                alert('User updated successfully!');
            } else {
                alert('Failed to update user');
            }
        } catch (err) {
            console.error('Error updating user:', err);
            alert('Error updating user: ' + err.message);
        }
    };

    const handleDeleteUser = async (userId) => {
        try {
            // Make API call to delete user
            const authConfig = getAuthAxiosConfig();
            const response = await axios.delete(`${import.meta.env.VITE_APIURL}/api/user/delete-user/${userId}`, authConfig);
            
            if (response.data && response.data.status === "Success") {
                // Update local state
                setUsers(prev => prev.filter(user => user._id !== userId));
                
                // Update pagination
                const newUserCount = users.length - 1;
                setPagination(prev => ({
                    ...prev,
                    totalRecords: newUserCount,
                    totalPages: Math.ceil(newUserCount / prev.pageSize)
                }));
                
                alert('User deleted successfully!');
            } else {
                alert('Failed to delete user');
            }
        } catch (err) {
            console.error('Error deleting user:', err);
            alert('Error deleting user: ' + err.message);
        }
    };

    const handleCreateUser = async (userData) => {
        try {
            // Make API call to create user
            const authConfig = getAuthAxiosConfig();
            const response = await axios.post(`${import.meta.env.VITE_APIURL}/api/user/create-user`, userData, authConfig);
            
            if (response.data && response.data.status === "Success") {
                // Add new user to local state
                const newUser = response.data.data;
                setUsers(prev => [...prev, newUser]);
                
                // Update pagination
                const newUserCount = users.length + 1;
                setPagination(prev => ({
                    ...prev,
                    totalRecords: newUserCount,
                    totalPages: Math.ceil(newUserCount / prev.pageSize)
                }));
                
                alert('User created successfully!');
            } else {
                alert('Failed to create user');
            }
        } catch (err) {
            console.error('Error creating user:', err);
            alert('Error creating user: ' + err.message);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Show loading state
    if (loading) {
        return (
            <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
                <div className="flex justify-center items-center h-64">
                    <div className="text-xl text-gray-600 dark:text-gray-300">Loading users...</div>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
                <div className="flex justify-center items-center h-64">
                    <div className="text-xl text-red-600 dark:text-red-400">
                        {error}
                        <button 
                            onClick={fetchUsers}
                            className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
            <UserManagementTable
                users={users}
                pagination={pagination}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                onCreateUser={handleCreateUser}
            />
        </div>
    );
};

export default UserManagement;