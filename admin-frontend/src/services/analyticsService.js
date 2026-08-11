import { authenticatedFetch } from '../utils/authUtils';

const API_BASE_URL = import.meta.env.VITE_APIURL || 'http://localhost:3000';

class AnalyticsService {
  // Get sell device analytics
  async getSellDeviceAnalytics(timeRange = 'month') {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/sell-device/statistics?timeRange=${timeRange}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching sell device analytics:', error);
      throw error;
    }
  }

  // Get device inventory analytics
  async getDeviceInventoryAnalytics(timeRange = 'month') {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/device-inventory/statistics?timeRange=${timeRange}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch inventory analytics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching inventory analytics:', error);
      throw error;
    }
  }

  // Get combined sales analytics for sales manager dashboard
  async getCombinedAnalytics(timeRange = 'month') {
    try {
      const [sellDeviceData, inventoryData] = await Promise.allSettled([
        this.getSellDeviceAnalytics(timeRange),
        this.getDeviceInventoryAnalytics(timeRange)
      ]);

      // Combine the data from both sources
      const analytics = {
        sellDevices: sellDeviceData.status === 'fulfilled' ? sellDeviceData.value : {},
        inventory: inventoryData.status === 'fulfilled' ? inventoryData.value : {},
        timeRange
      };

      // Process and combine the data for dashboard display
      return this.processCombinedAnalytics(analytics);
    } catch (error) {
      console.error('Error fetching combined analytics:', error);
      throw error;
    }
  }

  // Process and combine analytics data
  processCombinedAnalytics(data) {
    const { sellDevices, inventory } = data;
    
    return {
      // Revenue metrics
      totalRevenue: (sellDevices.totalRevenue || 0) + (inventory.totalRevenue || 0),
      sellDeviceRevenue: sellDevices.totalRevenue || 0,
      inventoryRevenue: inventory.totalRevenue || 0,
      
      // Sales metrics
      totalSales: (sellDevices.totalSales || 0) + (inventory.totalSales || 0),
      sellDeviceSales: sellDevices.totalSales || 0,
      inventorySales: inventory.totalSales || 0,
      
      // Pending metrics
      pendingRequests: sellDevices.pendingCount || 0,
      lowStockItems: inventory.lowStockCount || 0,
      
      // Average price
      averagePrice: this.calculateAveragePrice(data),
      
      // Top performing devices
      topDevices: this.combineTopDevices(sellDevices.topDevices || [], inventory.topDevices || []),
      
      // Trends
      salesTrend: this.combineTrends(sellDevices.trends || [], inventory.trends || []),
      
      // Customer metrics
      customerMetrics: {
        newCustomers: sellDevices.newCustomers || 0,
        returningCustomers: inventory.returningCustomers || 0,
        averageRating: inventory.averageRating || 0
      },
      
      // Raw data for reference
      rawData: { sellDevices, inventory }
    };
  }

  calculateAveragePrice(data) {
    const totalRevenue = (data.sellDevices.totalRevenue || 0) + (data.inventory.totalRevenue || 0);
    const totalSales = (data.sellDevices.totalSales || 0) + (data.inventory.totalSales || 0);
    
    return totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0;
  }

  combineTopDevices(sellDevices = [], inventoryDevices = []) {
    const deviceMap = new Map();
    
    // Add sell device data
    sellDevices.forEach(device => {
      const key = `${device.brand}-${device.model}`;
      deviceMap.set(key, {
        brand: device.brand,
        model: device.model,
        sales: device.sales || 0,
        revenue: device.revenue || 0,
        source: 'sell'
      });
    });
    
    // Add inventory device data
    inventoryDevices.forEach(device => {
      const key = `${device.brand}-${device.model}`;
      const existing = deviceMap.get(key);
      
      if (existing) {
        existing.sales += device.sales || 0;
        existing.revenue += device.revenue || 0;
        existing.source = 'both';
      } else {
        deviceMap.set(key, {
          brand: device.brand,
          model: device.model,
          sales: device.sales || 0,
          revenue: device.revenue || 0,
          source: 'inventory'
        });
      }
    });
    
    // Sort by revenue and return top 5
    return Array.from(deviceMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }

  combineTrends(sellTrends = [], inventoryTrends = []) {
    const trendMap = new Map();
    
    // Add sell device trends
    sellTrends.forEach(trend => {
      trendMap.set(trend.period || trend.month, {
        period: trend.period || trend.month,
        sales: trend.sales || 0,
        revenue: trend.revenue || 0
      });
    });
    
    // Add inventory trends
    inventoryTrends.forEach(trend => {
      const existing = trendMap.get(trend.period || trend.month);
      
      if (existing) {
        existing.sales += trend.sales || 0;
        existing.revenue += trend.revenue || 0;
      } else {
        trendMap.set(trend.period || trend.month, {
          period: trend.period || trend.month,
          sales: trend.sales || 0,
          revenue: trend.revenue || 0
        });
      }
    });
    
    // Sort by period and return as array
    return Array.from(trendMap.values())
      .sort((a, b) => new Date(a.period) - new Date(b.period));
  }
}

export default new AnalyticsService();