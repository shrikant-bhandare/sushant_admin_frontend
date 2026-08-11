import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext'; // Adjust path as needed
import { FaTimes } from 'react-icons/fa';
import axios from "axios";
import { getAuthAxiosConfig } from '../../utils/authUtils';

const AddUserModal = ({ isOpen, onClose }) => {
    const { isDarkMode } = useTheme();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Basic validation
        if (!username || !email || !password || !confirmPassword || !role) {
            setError("All fields are required");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        const validRoles = ["admin", "manager", "customer", "technician", "receptionist", "diagnostic-technician", "inventory-manager", "sales-manager"];
        if (!validRoles.includes(role)) {
            setError("Invalid role selected");
            return;
        }

        try {
            const authConfig = getAuthAxiosConfig();
            const response = await axios.post(
                `${import.meta.env.VITE_APIURL}/api/auth/register`,
                {
                    username,
                    password,
                    email,
                    role,
                },
                {
                    ...authConfig,
                    headers: {
                        ...authConfig.headers,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.status === 201) {
                setSuccess("User created successfully");
                console.log({data:response.data});
                
                // Reset form after successful creation
                setTimeout(() => {
                    resetForm();
                    onClose(); // Close modal
                }, 2000);
            } else {
                setError("Failed to create user");
            }
        } catch (err) {
            if (err.response && err.response.data && err.response.data.errors) {
                setError(err.response.data.errors[0].msg);
            } else {
                setError("An error occurred while creating the user");
            }
        }
    };

    const resetForm = () => {
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setRole("");
        setError("");
        setSuccess("");
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    // Don't render if modal is not open
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`rounded-lg shadow-lg p-8 max-w-md w-full mx-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        Add New User
                    </h2>
                    <button
                        onClick={handleClose}
                        className={`p-2 rounded-full hover:bg-gray-200 ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'text-gray-600'}`}
                    >
                        <FaTimes />
                    </button>
                </div>
                
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                {success && <p className="text-green-500 text-center mb-4">{success}</p>}
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label
                            className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                            htmlFor="username"
                        >
                            Full Name
                        </label>
                        <input
                            className={`shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-purple-500 ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-700 border-gray-300'}`}
                            id="username"
                            type="text"
                            placeholder="Full Name"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    
                    <div className="mb-4">
                        <label
                            className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                            htmlFor="email"
                        >
                            Email
                        </label>
                        <input
                            className={`shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-purple-500 ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-700 border-gray-300'}`}
                            id="email"
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    
                    <div className="mb-4">
                        <label
                            className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                            htmlFor="password"
                        >
                            Password
                        </label>
                        <input
                            className={`shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-purple-500 ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-700 border-gray-300'}`}
                            id="password"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    
                    <div className="mb-4">
                        <label
                            className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                            htmlFor="confirmPassword"
                        >
                            Confirm Password
                        </label>
                        <input
                            className={`shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-purple-500 ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-700 border-gray-300'}`}
                            id="confirmPassword"
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                    
                    <div className="mb-6">
                        <label
                            className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                            htmlFor="role"
                        >
                            Role
                        </label>
                        <select
                            className={`shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-purple-500 ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-700 border-gray-300'}`}
                            id="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="">Select Role</option>
                            <option value="customer">Consumer</option>
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="technician">Technician</option>
                            <option value="receptionist">Receptionist</option>
                            <option value="diagnostic-technician">Diagnostic Technician</option>
                            <option value="inventory-manager">Inventory Manager</option>
                            <option value="sales-manager">Sales Manager</option>
                        </select>
                    </div>
                    
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className={`flex-1 py-2 px-4 rounded-md font-semibold ${isDarkMode ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}`}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-md shadow-md hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Create User
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUserModal;