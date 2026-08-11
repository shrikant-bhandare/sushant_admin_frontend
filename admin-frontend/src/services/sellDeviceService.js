import { authenticatedFetch } from '../utils/authUtils';

const API_BASE_URL = import.meta.env.VITE_APIURL || 'http://localhost:3000';

class SellDeviceService {
  // Get all sell device entries with pagination and filtering
  async getAllSellDevices(page = 1, limit = 10, filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/sell-devices?${queryParams}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch sell devices: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching sell devices:', error);
      throw error;
    }
  }

  // Get sell device statistics
  async getSellDeviceStatistics() {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/sell-devices/statistics`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch statistics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching sell device statistics:', error);
      throw error;
    }
  }

  // Get specific sell device entry by ID
  async getSellDeviceById(id) {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/sell-devices/${id}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch sell device: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching sell device by ID:', error);
      throw error;
    }
  }

  // Update sell device status
  async updateSellDeviceStatus(id, status, quotedPrice = null) {
    try {
      const body = { status };
      
      // Include quotedPrice if provided and convert to number
      if (quotedPrice !== null && quotedPrice !== undefined && quotedPrice !== '') {
        body.quotedPrice = Number(quotedPrice);
      }

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/sell-devices/${id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify(body)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating sell device status:', error);
      throw error;
    }
  }

  // Update sell device entry
  async updateSellDevice(id, deviceData) {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/sell-devices/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(deviceData)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update sell device: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating sell device:', error);
      throw error;
    }
  }

  // Delete sell device entry
  async deleteSellDevice(id) {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/sell-devices/${id}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete sell device: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting sell device:', error);
      throw error;
    }
  }
}

export default new SellDeviceService();