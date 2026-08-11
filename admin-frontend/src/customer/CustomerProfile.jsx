import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import useLoader from '../customHooks/useLoader';
import { getDeviceTypes, getDeviceModels } from '../services/InventoryService'; // Import services
// import useRole from '../customHooks/useRole'; // Import the useRole hook
import useRole from "../customHooks/useRole";
import CustomerAddress from "./CustomerAddress";
import { toast } from 'react-toastify'; // Import toast for notifications
import { getWelcomeMessage } from '../services/messageTemplates'; // Import the getWelcomeMessage function
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaMobile, FaPlus, FaTrash, FaDesktop, FaBarcode, FaIdCard, FaSave, FaTimes, FaUserCircle, FaShieldAlt, FaEdit, FaCheck } from 'react-icons/fa';

const CustomerProfile = ({onClose, setReloadData, customer, isEdit}) => {
  const userRole = useRole(); 
  const { isDarkMode } = useTheme();
  const { Loader, showLoader, hideLoader } = useLoader();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
  });
  const [devices, setDevices] = useState([{ imei: '', serialNumber: '', deviceType: '', deviceModel: '' }]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [deviceModels, setDeviceModels] = useState([]);

  // Initialize form data when editing
  useEffect(() => {
    if (isEdit && customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phoneNumber || '',
        alternatePhone: customer.alternativePhoneNumber || '',
        address: customer.address || '',
      });

      // Set devices if they exist and fetch device models for each device type
      if (customer.devices && customer.devices.length > 0) {
        const loadDevicesAndModels = async () => {
          try { 
            // First, get all device types
            const deviceTypesResponse = await getDeviceTypes();
            const fetchedDeviceTypes = deviceTypesResponse.data.deviceTypes || [];
            setDeviceTypes(fetchedDeviceTypes);

            // Then, for each device, fetch its models
            const devicesWithModels = [];
            const allDeviceModels = [];

            for (const device of customer.devices) {
              if (device.deviceType) {
                try {
                  const deviceModelsResponse = await getDeviceModels(device.deviceType);
                  const fetchedDeviceModels = deviceModelsResponse.data.deviceModels || [];
                  allDeviceModels.push(...fetchedDeviceModels);
                } catch (error) {
                  console.error(`Error fetching models for device type ${device.deviceType}:`, error);
                }
              }

              devicesWithModels.push({
                imei: device.imei || '',
                serialNumber: device.serialNumber || '',
                deviceType: device.deviceType || '',
                deviceModel: device.deviceModel || '',
              });
            }

            // Remove duplicates from device models
            const uniqueDeviceModels = allDeviceModels.filter((model, index, self) => 
              index === self.findIndex(m => m._id === model._id)
            );

            setDeviceModels(uniqueDeviceModels);
            setDevices(devicesWithModels);
          } catch (error) {
            console.error('Error loading devices and models:', error);
          }
        };

        loadDevicesAndModels();
      } else {
        // If no devices, just load device types
        getDeviceTypes().then(response => {
          setDeviceTypes(response.data.deviceTypes || []);
        }).catch(error => {
          console.error('Error fetching device types:', error);
        });
      }
    }
  }, [isEdit, customer]);

  useEffect(() => {
    const fetchCustomerData = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          const userId = decodedToken['id'];

          setFormData((prev) => ({
            ...prev,
            name: decodedToken['name'] || '',
            email: decodedToken['email'] || '',
          }));

          showLoader();

          // Fetch customer data and device types in parallel
          const [customerResponse, deviceTypesResponse] = await Promise.all([
            axios.get(`${import.meta.env.VITE_APIURL}/api/customers/list?userId=${userId}`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
            }),
            getDeviceTypes(),
          ]);

          const customers = customerResponse.data?.data?.customers || [];
          const fetchedDeviceTypes = deviceTypesResponse.data.deviceTypes || [];
          setDeviceTypes(fetchedDeviceTypes);

          if (customers.length > 0) {
            const customer = customers[0];
            setFormData({
              name: customer.userId.name,
              email: customer.userId.email,
              phone: customer.phoneNumber,
              alternatePhone: customer.alternativePhoneNumber,
            });

            // Map devices with their types and models
            const updatedDevices = await Promise.all(
              customer.devices.map(async (device) => {
                const deviceType = fetchedDeviceTypes.find((type) => type._id === device.deviceType) || {};
                const deviceModelsResponse = await getDeviceModels(device.deviceType);
                const fetchedDeviceModels = deviceModelsResponse.data.deviceModels || [];
                const deviceModel = fetchedDeviceModels.find((model) => model._id === device.deviceModel) || {};

                // Set device models for the current device type
                setDeviceModels((prevModels) => [...prevModels, ...fetchedDeviceModels]);

                return {
                  ...device,
                  deviceType: deviceType._id,
                  deviceModel: deviceModel._id,
                };
              })
            );

            setDevices(updatedDevices);
          }
        } catch (error) {
          console.error('Error fetching customer data:', error);
        } finally {
          hideLoader();
        }
      }
    };
    const fetchDeviceTypesForNonCustomer = async () => {
      try {
        const response = await getDeviceTypes();
        const fetchedDeviceTypes = response.data.deviceTypes || [];
        setDeviceTypes(fetchedDeviceTypes);
      } catch (error) {
        console.error('Error fetching device types:', error);
      }
    };

    // Only fetch customer data if not in edit mode
    if (userRole === 'customer' && !isEdit) {
      fetchCustomerData();
    } else if (!isEdit) {
      // Only fetch device types if not in edit mode (edit mode handles this separately)
      fetchDeviceTypesForNonCustomer();
    }
  }, [userRole, isEdit]);

  const handleDeviceTypeChange = async (index, value) => {
    const updatedDevices = [...devices];
    updatedDevices[index].deviceType = value;
    updatedDevices[index].deviceModel = ''; // Reset device model when device type changes
    setDevices(updatedDevices);

    // Fetch device models for the selected device type
    try {
      const response = await getDeviceModels(value);
      setDeviceModels(response.data.deviceModels || []);
    } catch (error) {
      console.error('Error fetching device models:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDeviceChange = (index, field, value) => {
    const updatedDevices = [...devices];
    updatedDevices[index][field] = value;
    setDevices(updatedDevices);
  };

  const addDevice = () => {
    setDevices([...devices, { imei: '', serialNumber: '', deviceType: '', deviceModel: '' }]);
  };

  const removeDevice = (index) => {
    const updatedDevices = devices.filter((_, i) => i !== index);
    setDevices(updatedDevices);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    showLoader(); // Show loader before API call

    const apiEndpoint = isEdit 
      ? `${import.meta.env.VITE_APIURL}/api/customers/${customer._id}`
      : `${import.meta.env.VITE_APIURL}/api/customers/create-or-update`;

    const requestMethod = isEdit ? 'PUT' : 'POST';

    const requestData = {
      name: formData.name,
      email: formData.email,
      phoneNumber: formData.phone,
      alternativePhoneNumber: formData.alternatePhone,
      address: formData.address,
      devices,
    };

    console.log('🔍 API Request Details:', {
      method: requestMethod,
      url: apiEndpoint,
      data: requestData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json',
      }
    });

    axios({
      method: requestMethod,
      url: apiEndpoint,
      data: requestData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json',
      },
    })
      .then(async (response) => {
        console.log(`Customer ${isEdit ? 'updated' : 'created'} successfully:`, response.data);
        toast.success(response.data.message || `Customer ${isEdit ? 'updated' : 'created'} successfully!`);
        
        // Only send welcome message for new customers, not edits
        if (!isEdit) {
          const message = getWelcomeMessage(formData.name); // Use formData.name for the message
          console.log(`Sending WhatsApp message to ${formData.phone}: ${message}`);
          const welcomeMessageResponse = await fetch(`${import.meta.env.VITE_APIURL}/api/messages/send-whatsapp`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
            },
            body: JSON.stringify({
              phoneNumber: formData.phone,
              message: message,
            }),
          });
          if (welcomeMessageResponse.ok) {
            console.log("Welcome message sent successfully");
          } else {
            console.error("Failed to send welcome message");
          }
        }

        // Clear form data and devices only for new customers
        if (!isEdit) {
          setFormData({
            name: '',
            email: '',
            phone: '',
            alternatePhone: '',
            address: '',
          });
          setDevices([{ imei: '', serialNumber: '', deviceType: '', deviceModel: '' }]);
        }
        
        if(onClose){
          onClose();
        }
        if(setReloadData){
          setReloadData(prev => !prev); // Toggle to trigger reload
        }
      })
      .catch((error) => {
        console.error(`Error ${isEdit ? 'updating' : 'creating'} customer:`, error);
        console.error('Error details:', {
          response: error.response?.data,
          status: error.response?.status,
          statusText: error.response?.statusText
        });
        
        let errorMessage = `Failed to ${isEdit ? 'update' : 'create'} customer.`;
        
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast.error(errorMessage);
      })
      .finally(() => {
        hideLoader(); // Hide loader after API call
      });
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"}`}>
      <Loader /> {/* Render the loader */}
      
      {/* Enhanced Modern Header with Gradient Background */}
      <div className={`sticky top-0 z-10 backdrop-blur-lg ${isDarkMode ? "bg-gray-800/90 border-gray-700" : "bg-white/90 border-gray-200"} border-b shadow-lg`}>
        <div className="w-full px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className={`p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br ${isDarkMode ? "from-purple-600 to-purple-700 shadow-purple-500/25" : "from-purple-100 to-purple-200 shadow-purple-200/50"} shadow-xl`}>
                <FaUserCircle className={`text-lg sm:text-2xl ${isDarkMode ? "text-white" : "text-purple-600"}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className={`text-lg sm:text-xl font-bold bg-gradient-to-r ${isDarkMode ? "from-white to-gray-300" : "from-gray-900 to-gray-700"} bg-clip-text text-transparent`}>
                    {isEdit ? 'Edit Customer' : (userRole === 'customer' ? 'My Profile' : 'Add New Customer')}
                  </h1>
                  {userRole === 'customer' && (
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${isDarkMode ? "bg-purple-600/20 text-purple-300 border border-purple-600/30" : "bg-purple-100 text-purple-700 border border-purple-200"}`}>
                      <FaShieldAlt className="inline mr-1" size={9} />
                      <span className="hidden sm:inline">Customer</span>
                    </div>
                  )}
                </div>
                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"} hidden sm:block`}>
                  {isEdit ? 'Update customer information and device details' : (userRole === 'customer' ? 'Manage your profile and registered devices' : 'Create a comprehensive customer profile with device information')}
                </p>
              </div>
            </div>
            
            {onClose && (
              <button
                onClick={onClose}
                className={`inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 text-sm ${
                  isDarkMode 
                    ? "bg-gray-700/80 hover:bg-gray-600 text-gray-300 hover:text-white border border-gray-600 shadow-lg" 
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 border border-gray-200 shadow-md"
                }`}
              >
                <FaTimes className="mr-1 sm:mr-2" size={12} />
                <span className="hidden sm:inline">Close</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content with Enhanced Layout */}
      <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-8">
        <div className="max-w-5xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* Personal Information Section with Enhanced Design */}
            <div className={`rounded-2xl sm:rounded-3xl shadow-2xl border transform transition-all duration-300 hover:shadow-3xl ${isDarkMode ? "bg-gradient-to-br from-gray-800 to-gray-850 border-gray-700/50" : "bg-gradient-to-br from-white to-gray-50 border-gray-200/50"}`}>
              <div className={`p-4 sm:p-8 border-b ${isDarkMode ? "border-gray-700/50" : "border-gray-200/50"}`}>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br ${isDarkMode ? "from-purple-600 to-purple-700" : "from-purple-100 to-purple-200"}`}>
                    <FaUser className={`text-lg sm:text-xl ${isDarkMode ? "text-white" : "text-purple-600"}`} />
                  </div>
                  <div>
                    <h3 className={`text-base sm:text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      Personal Information
                    </h3>
                    <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"} hidden sm:block`}>
                      Basic contact and identification details
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                  <div className="space-y-2">
                    <label className={`flex items-center text-xs font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} htmlFor="name">
                      <div className={`p-1.5 rounded-md mr-2 ${isDarkMode ? "bg-purple-600/20" : "bg-purple-100"}`}>
                        <FaUser className={`${isDarkMode ? "text-purple-400" : "text-purple-600"}`} size={12} />
                      </div>
                      Full Name
                      {userRole === 'customer' && <span className="ml-1 text-xs opacity-75">(Read Only)</span>}
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      disabled={userRole === 'customer'}
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 text-sm ${
                        isDarkMode
                          ? "bg-gray-700/50 text-white border-gray-600 hover:border-gray-500 placeholder-gray-400"
                          : "bg-white text-gray-800 border-gray-300 hover:border-gray-400 placeholder-gray-500"
                      } ${userRole === 'customer' ? 'opacity-70 cursor-not-allowed backdrop-blur' : 'shadow-md hover:shadow-lg'}`}
                      placeholder="Enter full name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className={`flex items-center text-xs font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} htmlFor="email">
                      <div className={`p-1.5 rounded-md mr-2 ${isDarkMode ? "bg-purple-600/20" : "bg-purple-100"}`}>
                        <FaEnvelope className={`${isDarkMode ? "text-purple-400" : "text-purple-600"}`} size={12} />
                      </div>
                      Email Address
                      {userRole === 'customer' && <span className="ml-1 text-xs opacity-75">(Read Only)</span>}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={userRole === 'customer'}
                      className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 text-sm ${
                        isDarkMode
                          ? "bg-gray-700/50 text-white border-gray-600 hover:border-gray-500 placeholder-gray-400"
                          : "bg-white text-gray-800 border-gray-300 hover:border-gray-400 placeholder-gray-500"
                      } ${userRole === 'customer' ? 'opacity-70 cursor-not-allowed backdrop-blur' : 'shadow-md hover:shadow-lg'}`}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className={`flex items-center text-xs font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} htmlFor="phone">
                      <div className={`p-1.5 rounded-md mr-2 ${isDarkMode ? "bg-green-600/20" : "bg-green-100"}`}>
                        <FaPhone className={`${isDarkMode ? "text-green-400" : "text-green-600"}`} size={12} />
                      </div>
                      Primary Mobile Number
                    </label>
                    <input
                      type="text"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 shadow-md hover:shadow-lg text-sm ${
                        isDarkMode
                          ? "bg-gray-700/50 text-white border-gray-600 hover:border-gray-500 placeholder-gray-400"
                          : "bg-white text-gray-800 border-gray-300 hover:border-gray-400 placeholder-gray-500"
                      }`}
                      placeholder="Enter primary mobile number"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className={`flex items-center text-xs font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} htmlFor="alternatePhone">
                      <div className={`p-1.5 rounded-md mr-2 ${isDarkMode ? "bg-blue-600/20" : "bg-blue-100"}`}>
                        <FaMobile className={`${isDarkMode ? "text-blue-400" : "text-blue-600"}`} size={12} />
                      </div>
                      Alternate Mobile Number
                    </label>
                    <input
                      type="text"
                      id="alternatePhone"
                      name="alternatePhone"
                      value={formData.alternatePhone}
                      onChange={handleChange}
                      className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-md hover:shadow-lg text-sm ${
                        isDarkMode
                          ? "bg-gray-700/50 text-white border-gray-600 hover:border-gray-500 placeholder-gray-400"
                          : "bg-white text-gray-800 border-gray-300 hover:border-gray-400 placeholder-gray-500"
                      }`}
                      placeholder="Enter alternate mobile number"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className={`flex items-center text-xs font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} htmlFor="address">
                    <div className={`p-1.5 rounded-md mr-2 ${isDarkMode ? "bg-orange-600/20" : "bg-orange-100"}`}>
                      <FaMapMarkerAlt className={`${isDarkMode ? "text-orange-400" : "text-orange-600"}`} size={12} />
                    </div>
                    Complete Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 shadow-md hover:shadow-lg text-sm ${
                      isDarkMode
                        ? "bg-gray-700/50 text-white border-gray-600 hover:border-gray-500 placeholder-gray-400"
                        : "bg-white text-gray-800 border-gray-300 hover:border-gray-400 placeholder-gray-500"
                    }`}
                    placeholder="Enter complete address with city, state, and postal code"
                  />
                </div>
              </div>
            </div>

            {/* Enhanced Devices Section */}
            <div className={`rounded-2xl sm:rounded-3xl shadow-2xl border transform transition-all duration-300 hover:shadow-3xl ${isDarkMode ? "bg-gradient-to-br from-gray-800 to-gray-850 border-gray-700/50" : "bg-gradient-to-br from-white to-gray-50 border-gray-200/50"}`}>
              <div className={`p-4 sm:p-8 border-b ${isDarkMode ? "border-gray-700/50" : "border-gray-200/50"}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br ${isDarkMode ? "from-indigo-600 to-indigo-700" : "from-indigo-100 to-indigo-200"}`}>
                      <FaDesktop className={`text-lg sm:text-xl ${isDarkMode ? "text-white" : "text-indigo-600"}`} />
                    </div>
                    <div>
                      <h3 className={`text-base sm:text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        Device Management
                      </h3>
                      <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"} hidden sm:block`}>
                        Register and manage customer devices ({devices.length} device{devices.length !== 1 ? 's' : ''} registered)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addDevice}
                    className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-xs sm:text-sm"
                  >
                    <FaPlus className="mr-1 sm:mr-2" size={12} />
                    <span className="hidden sm:inline">Add New Device</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                </div>
              </div>
              
              <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
                {devices.map((device, index) => (
                  <div key={index} className={`p-4 sm:p-8 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.02] ${
                    isDarkMode ? "border-gray-600/50 bg-gradient-to-br from-gray-700/30 to-gray-800/30 shadow-xl" : "border-gray-300/50 bg-gradient-to-br from-gray-50/50 to-white/50 shadow-lg"
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
                          isDarkMode ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-600"
                        }`}>
                          {index + 1}
                        </div>
                        <h4 className={`text-sm sm:text-base font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          Device #{index + 1}
                        </h4>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          device.deviceType && device.deviceModel 
                            ? (isDarkMode ? "bg-green-600/20 text-green-300 border border-green-600/30" : "bg-green-100 text-green-700 border border-green-200")
                            : (isDarkMode ? "bg-yellow-600/20 text-yellow-300 border border-yellow-600/30" : "bg-yellow-100 text-yellow-700 border border-yellow-200")
                        }`}>
                          {device.deviceType && device.deviceModel ? 'Configured' : 'Pending Setup'}
                        </div>
                      </div>
                      {devices.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDevice(index)}
                          className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <FaTrash className="mr-1" size={10} />
                          <span className="hidden sm:inline">Remove Device</span>
                          <span className="sm:hidden">Remove</span>
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <label className={`flex items-center text-xs font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} htmlFor={`deviceType-${index}`}>
                          <div className={`p-1.5 rounded-md mr-2 ${isDarkMode ? "bg-indigo-600/20" : "bg-indigo-100"}`}>
                            <FaDesktop className={`${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`} size={12} />
                          </div>
                          Device Type
                        </label>
                        <select
                          id={`deviceType-${index}`}
                          value={device.deviceType}
                          onChange={(e) => handleDeviceTypeChange(index, e.target.value)}
                          className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 shadow-md hover:shadow-lg text-sm ${
                            isDarkMode
                              ? "bg-gray-700/50 text-white border-gray-600 hover:border-gray-500"
                              : "bg-white text-gray-800 border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          <option value="">Select Device Type</option>
                          {deviceTypes.map((type) => (
                            <option key={type._id} value={type._id}>
                              {type.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className={`flex items-center text-xs font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} htmlFor={`deviceModel-${index}`}>
                          <div className={`p-1.5 rounded-md mr-2 ${isDarkMode ? "bg-indigo-600/20" : "bg-indigo-100"}`}>
                            <FaDesktop className={`${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`} size={12} />
                          </div>
                          Device Model
                        </label>
                        <select
                          id={`deviceModel-${index}`}
                          value={device.deviceModel}
                          onChange={(e) => handleDeviceChange(index, 'deviceModel', e.target.value)}
                          className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 shadow-md hover:shadow-lg text-sm ${
                            isDarkMode
                              ? "bg-gray-700/50 text-white border-gray-600 hover:border-gray-500"
                              : "bg-white text-gray-800 border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          <option value="">Select Device Model</option>
                          {deviceModels.map((model) => (
                            <option key={model._id} value={model._id}>
                              {model.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className={`flex items-center text-xs font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} htmlFor={`imei-${index}`}>
                          <div className={`p-1.5 rounded-md mr-2 ${isDarkMode ? "bg-red-600/20" : "bg-red-100"}`}>
                            <FaBarcode className={`${isDarkMode ? "text-red-400" : "text-red-600"}`} size={12} />
                          </div>
                          IMEI Number
                        </label>
                        <input
                          type="text"
                          id={`imei-${index}`}
                          value={device.imei}
                          onChange={(e) => handleDeviceChange(index, 'imei', e.target.value)}
                          className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300 shadow-md hover:shadow-lg text-sm ${
                            isDarkMode
                              ? "bg-gray-700/50 text-white border-gray-600 hover:border-gray-500 placeholder-gray-400"
                              : "bg-white text-gray-800 border-gray-300 hover:border-gray-400 placeholder-gray-500"
                          }`}
                          placeholder="Enter device IMEI number"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className={`flex items-center text-xs font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} htmlFor={`serialNumber-${index}`}>
                          <div className={`p-1.5 rounded-md mr-2 ${isDarkMode ? "bg-teal-600/20" : "bg-teal-100"}`}>
                            <FaIdCard className={`${isDarkMode ? "text-teal-400" : "text-teal-600"}`} size={12} />
                          </div>
                          Serial Number
                        </label>
                        <input
                          type="text"
                          id={`serialNumber-${index}`}
                          value={device.serialNumber}
                          onChange={(e) => handleDeviceChange(index, 'serialNumber', e.target.value)}
                          className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-300 shadow-md hover:shadow-lg text-sm ${
                            isDarkMode
                              ? "bg-gray-700/50 text-white border-gray-600 hover:border-gray-500 placeholder-gray-400"
                              : "bg-white text-gray-800 border-gray-300 hover:border-gray-400 placeholder-gray-500"
                          }`}
                          placeholder="Enter device serial number"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className={`inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-300 transform hover:scale-105 text-sm ${
                    isDarkMode 
                      ? "bg-gray-700/80 hover:bg-gray-600 text-gray-300 hover:text-white border-2 border-gray-600 shadow-lg hover:shadow-xl" 
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border-2 border-gray-300 shadow-md hover:shadow-lg"
                  }`}
                >
                  <FaTimes className="mr-2" size={14} />
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 hover:from-purple-700 hover:via-purple-800 hover:to-purple-900 text-white font-medium rounded-lg sm:rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 text-sm"
              >
                <div className="flex items-center">
                  {userRole === 'customer' ? (
                    <>
                      <FaEdit className="mr-2" size={16} />
                      <span className="hidden sm:inline">Update My Profile</span>
                      <span className="sm:hidden">Update Profile</span>
                    </>
                  ) : isEdit ? (
                    <>
                      <FaEdit className="mr-2" size={16} />
                      <span className="hidden sm:inline">Update Customer</span>
                      <span className="sm:hidden">Update</span>
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" size={16} />
                      <span className="hidden sm:inline">Create Customer Profile</span>
                      <span className="sm:hidden">Create Customer</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;