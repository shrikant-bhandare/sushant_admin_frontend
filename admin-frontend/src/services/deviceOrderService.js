import { authenticatedFetch } from '../utils/authUtils';

const API_BASE_URL = import.meta.env.VITE_APIURL || 'http://localhost:3000';

class DeviceOrderService {
  // Get all device orders with pagination and filtering
  async getAllOrders(page = 1, limit = 10, filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/device-orders?${queryParams}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  // Get order statistics
  async getOrderStatistics() {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/device-orders/statistics`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch order statistics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching order statistics:', error);
      throw error;
    }
  }

  // Get specific order by ID
  async getOrderById(id) {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/device-orders/${id}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch order: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching order by ID:', error);
      throw error;
    }
  }

  // Update order status
  async updateOrderStatus(id, status) {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/device-orders/${id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update order status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  // Delete order
  async deleteOrder(id) {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/device-orders/${id}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete order: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  }
}

const deviceOrderService = new DeviceOrderService();
export default deviceOrderService;
