import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import useLoader from '../customHooks/useLoader'; // Import the useLoader hook
import {jwtDecode} from 'jwt-decode'; // Import jwtDecode

const CustomerAddress = () => {
  const { isDarkMode } = useTheme();
  const { Loader, showLoader, hideLoader } = useLoader(); // Destructure loader functions
  const [formData, setFormData] = useState({
    addressLine1: '',
    addressLine2: '',
    apartment: '',
    area: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [addressId, setAddressId] = useState(null);
  const [userId, setUserId] = useState(null); // State to store userId

  useEffect(() => {
    // Retrieve userId from token
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUserId(decodedToken['id']); // Set userId from decoded token
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (userId) {
      showLoader(); // Show loader before API call
      axios
        .get(`${import.meta.env.VITE_APIURL}/api/address?userId=${userId}&page=1&limit=10`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        })
        .then((response) => {
          const addresses = response.data?.data?.addresses || [];
          if (addresses.length > 0) {
            const address = addresses[0];
            setAddressId(address._id);
            setFormData({
              addressLine1: address.addressLine1,
              addressLine2: address.addressLine2,
              apartment: address.apartment,
              area: address.area,
              city: address.city,
              state: address.state,
              pincode: address.pincode,
            });
          }
        })
        .catch((error) => {
          console.error('Error fetching address:', error);
        })
        .finally(() => {
          hideLoader(); // Hide loader after API call
        });
    }
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    showLoader(); // Show loader before API call
    if (addressId) {
      // Update existing address
      axios
        .put(`${import.meta.env.VITE_APIURL}/api/address/${addressId}`, formData, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        })
        .then((response) => {
          console.log('Address updated successfully:', response.data);
        })
        .catch((error) => {
          console.error('Error updating address:', error);
        })
        .finally(() => {
          hideLoader(); // Hide loader after API call
        });
    } else {
      // Create new address
      axios
        .post(`${import.meta.env.VITE_APIURL}/api/address`, { ...formData, userId }, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        })
        .then((response) => {
          console.log('Address created successfully:', response.data);
          setAddressId(response.data.data._id); // Set the new address ID
        })
        .catch((error) => {
          console.error('Error creating address:', error);
        })
        .finally(() => {
          hideLoader(); // Hide loader after API call
        });
    }
  };

  return (
    <div
      className={`p-6 rounded-lg shadow-md ${
        isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
      }`}
    >
      <Loader /> {/* Render the loader */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium" htmlFor="addressLine1">
            Address Line 1:
          </label>
          <input
            type="text"
            id="addressLine1"
            
            name="addressLine1"
            value={formData.addressLine1}
            onChange={handleChange}
            className={`w-full p-2 border rounded ${
              isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
            }`}
          />
        </div>
        <div>
          <label className="block font-medium" htmlFor="addressLine2">
            Address Line 2:
          </label>
          <input
            type="text"
            id="addressLine2"
            name="addressLine2"
            value={formData.addressLine2}
            onChange={handleChange}
            className={`w-full p-2 border rounded ${
              isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
            }`}
          />
        </div>
        <div>
          <label className="block font-medium" htmlFor="apartment">
            Apartment:
          </label>
          <input
            type="text"
            id="apartment"
            name="apartment"
            value={formData.apartment}
            onChange={handleChange}
            className={`w-full p-2 border rounded ${
              isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
            }`}
          />
        </div>
        <div>
          <label className="block font-medium" htmlFor="area">
            Area:
          </label>
          <input
            type="text"
            id="area"
            name="area"
            value={formData.area}
            onChange={handleChange}
            className={`w-full p-2 border rounded ${
              isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
            }`}
          />
        </div>
        <div>
          <label className="block font-medium" htmlFor="city">
            City:
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className={`w-full p-2 border rounded ${
              isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
            }`}
          />
        </div>
        <div>
          <label className="block font-medium" htmlFor="state">
            State:
          </label>
          <input
            type="text"
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
            className={`w-full p-2 border rounded ${
              isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
            }`}
          />
        </div>
        <div>
          <label className="block font-medium" htmlFor="pincode">
            Pincode:
          </label>
          <input
            type="text"
            id="pincode"
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            className={`w-full p-2 border rounded ${
              isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
            }`}
          />
        </div>
        <button
          type="submit"
          className={`px-4 py-2 rounded ${
            isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
          }`}
        >
          {addressId ? 'Update Address' : 'Add Address'}
        </button>
      </form>
    </div>
  );
};

export default CustomerAddress;