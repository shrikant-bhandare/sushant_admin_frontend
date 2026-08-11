import { authenticatedFetch } from '../utils/authUtils';

const API_BASE_URL = import.meta.env.VITE_APIURL || 'http://localhost:3000';

class DeviceInventoryService {
  // Get all devices with pagination and filtering
  async getAllDevices(page = 1, limit = 10, filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/device-inventory?${queryParams}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch devices: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching devices:', error);
      throw error;
    }
  }

  // Get device statistics
  async getDeviceStatistics() {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/device-inventory/statistics`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch device statistics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching device statistics:', error);
      throw error;
    }
  }

  // Get specific device by ID
  async getDeviceById(id) {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/device-inventory/${id}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch device: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching device by ID:', error);
      throw error;
    }
  }

  // Create new device
  async createDevice(deviceData) {
    try {
      // Handle form data for file uploads
      const isFormData = deviceData instanceof FormData;
      
      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/device-inventory`,
        {
          method: 'POST',
          ...(isFormData ? {} : { headers: { 'Content-Type': 'application/json' } }),
          body: isFormData ? deviceData : JSON.stringify(deviceData)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create device: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating device:', error);
      throw error;
    }
  }

  // Update device
  async updateDevice(id, deviceData) {
    try {
      // Handle form data for file uploads
      const isFormData = deviceData instanceof FormData;
      
      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/device-inventory/${id}`,
        {
          method: 'PUT',
          ...(isFormData ? {} : { headers: { 'Content-Type': 'application/json' } }),
          body: isFormData ? deviceData : JSON.stringify(deviceData)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update device: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating device:', error);
      throw error;
    }
  }

  // Delete device
  async deleteDevice(id) {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/device-inventory/${id}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete device: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting device:', error);
      throw error;
    }
  }

  // Get devices by category
  async getDevicesByCategory(category) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/device-inventory/category/${category}`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch devices by category: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching devices by category:', error);
      throw error;
    }
  }

  // Search devices
  async searchDevices(searchTerm, filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        q: searchTerm,
        ...filters
      });

      const response = await fetch(
        `${API_BASE_URL}/api/device-inventory/search?${queryParams}`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to search devices: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching devices:', error);
      throw error;
    }
  }
}

export default new DeviceInventoryService();