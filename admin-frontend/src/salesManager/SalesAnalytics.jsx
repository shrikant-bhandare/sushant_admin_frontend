import React, { useState, useEffect } from 'react';
import { 
  FaChartLine, 
  FaDollarSign, 
  FaArrowUp, 
  FaArrowDown,
  FaCalendar,
  FaMobile,
  FaUsers,
  FaBoxes,
  FaShoppingCart
} from 'react-icons/fa';
import { useTheme, useRoleTheme } from '../context/ThemeContext';
import sellDeviceService from '../services/sellDeviceService';
import deviceInventoryService from '../services/deviceInventoryService';
import deviceOrderService from '../services/deviceOrderService';

const SalesAnalytics = () => {
    const { isDarkMode } = useTheme();
    const { theme, getCardClasses, getIconClasses } = useRoleTheme();
    
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState('month');

    // Fetch real analytics data from all sources
    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const [sellDeviceStats, inventoryStats, orderStats] = await Promise.allSettled([
                sellDeviceService.getSellDeviceStatistics(),
                deviceInventoryService.getDeviceStatistics(),
                deviceOrderService.getOrderStatistics()
            ]);

            const sellStats = sellDeviceStats.status === 'fulfilled' 
                ? (sellDeviceStats.value?.data || sellDeviceStats.value || {}) 
                : {};
            const invStats = inventoryStats.status === 'fulfilled' 
                ? (inventoryStats.value?.data || inventoryStats.value || {}) 
                : {};
            const ordStats = orderStats.status === 'fulfilled' 
                ? (orderStats.value?.data || orderStats.value || {}) 
                : {};

            // Combine all analytics data
            setAnalyticsData({
                // Revenue from orders
                totalRevenue: ordStats.totalRevenue || 0,
                
                // Order counts
                totalOrders: ordStats.total || 0,
                pendingOrders: ordStats.pending || 0,
                deliveredOrders: ordStats.delivered || 0,
                
                // Sell device stats
                totalSellRequests: sellStats.totalDevices || 0,
                pendingRequests: sellStats.pendingCount || 0,
                quotedDevices: sellStats.quotedCount || 0,
                completedDeals: sellStats.completedCount || 0,
                totalQuotedValue: sellStats.totalQuotedValue || 0,
                avgExpectedPrice: sellStats.avgExpectedPrice || 0,
                
                // Inventory stats
                totalInventory: invStats.totalDevices || 0,
                activeStock: invStats.activeCount || 0,
                soldItems: invStats.soldCount || 0,
                totalStockValue: invStats.totalValue || 0,
                averagePrice: invStats.averagePrice || 0,
                
                // Category breakdown
                categoryBreakdown: invStats.categoryBreakdown || {},
                brandBreakdown: invStats.brandBreakdown || {},
                conditionBreakdown: invStats.conditionBreakdown || {},
                
                // Order status breakdown
                orderStatusBreakdown: {
                    pending: ordStats.pending || 0,
                    contacted: ordStats.contacted || 0,
                    confirmed: ordStats.confirmed || 0,
                    paid: ordStats.paid || 0,
                    shipped: ordStats.shipped || 0,
                    delivered: ordStats.delivered || 0,
                    cancelled: ordStats.cancelled || 0
                }
            });
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setError(error.message || 'Failed to fetch analytics data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    if (loading) {
        return (
            <div className={`p-6 ${theme.background} min-h-screen`}>
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    <span className="ml-3 text-lg">Loading analytics...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`p-6 ${theme.background} min-h-screen`}>
                <div className="text-center py-12">
                    <div className="text-red-600 mb-4">
                        <p className="text-lg mb-2">Error loading analytics</p>
                        <p className="text-sm">{error}</p>
                    </div>
                    <button 
                        onClick={fetchAnalytics}
                        className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!analyticsData) {
        return (
            <div className={`p-6 ${theme.background} min-h-screen`}>
                <div className="text-center py-12">
                    <p className="text-gray-500">No analytics data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`p-6 ${theme.background} min-h-screen`}>
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className={`text-3xl font-bold ${theme.primary} mb-2`}>
                            Sales Analytics
                        </h1>
                        <p className={`${theme.secondary}`}>
                            Track sales performance and revenue insights
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <FaCalendar className={theme.primary} />
                        <select 
                            value={timeRange} 
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="border rounded px-3 py-2"
                        >
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="quarter">This Quarter</option>
                            <option value="year">This Year</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className={`p-6 rounded-lg ${getCardClasses()}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm ${theme.secondary} mb-1`}>Total Revenue</p>
                            <p className={`text-2xl font-bold ${theme.primary}`}>
                                {formatCurrency(analyticsData.totalRevenue)}
                            </p>
                            <p className="text-sm text-green-600 flex items-center gap-1">
                                <FaShoppingCart size={12} /> From {analyticsData.deliveredOrders} orders
                            </p>
                        </div>
                        <FaDollarSign className="text-3xl text-green-500" />
                    </div>
                </div>

                <div className={`p-6 rounded-lg ${getCardClasses()}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm ${theme.secondary} mb-1`}>Total Orders</p>
                            <p className={`text-2xl font-bold ${theme.primary}`}>
                                {analyticsData.totalOrders}
                            </p>
                            <p className="text-sm text-yellow-600 flex items-center gap-1">
                                <FaArrowUp size={12} /> {analyticsData.pendingOrders} pending
                            </p>
                        </div>
                        <FaShoppingCart className="text-3xl text-blue-500" />
                    </div>
                </div>

                <div className={`p-6 rounded-lg ${getCardClasses()}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm ${theme.secondary} mb-1`}>Stock Value</p>
                            <p className={`text-2xl font-bold ${theme.primary}`}>
                                {formatCurrency(analyticsData.totalStockValue)}
                            </p>
                            <p className="text-sm text-blue-600 flex items-center gap-1">
                                <FaBoxes size={12} /> {analyticsData.activeStock} items
                            </p>
                        </div>
                        <FaChartLine className="text-3xl text-purple-500" />
                    </div>
                </div>

                <div className={`p-6 rounded-lg ${getCardClasses()}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm ${theme.secondary} mb-1`}>Pending Requests</p>
                            <p className={`text-2xl font-bold ${theme.primary}`}>
                                {analyticsData.pendingRequests}
                            </p>
                            <p className="text-sm text-yellow-600 flex items-center gap-1">
                                <FaUsers size={12} /> Review needed
                            </p>
                        </div>
                        <FaUsers className="text-3xl text-orange-500" />
                    </div>
                </div>
            </div>

            {/* Second Row Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className={`p-6 rounded-lg ${getCardClasses()}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm ${theme.secondary} mb-1`}>Quoted Value</p>
                            <p className={`text-2xl font-bold ${theme.primary}`}>
                                {formatCurrency(analyticsData.totalQuotedValue)}
                            </p>
                            <p className="text-sm text-purple-600 flex items-center gap-1">
                                <FaMobile size={12} /> {analyticsData.quotedDevices} devices
                            </p>
                        </div>
                        <FaMobile className="text-3xl text-purple-500" />
                    </div>
                </div>

                <div className={`p-6 rounded-lg ${getCardClasses()}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm ${theme.secondary} mb-1`}>Avg. Device Price</p>
                            <p className={`text-2xl font-bold ${theme.primary}`}>
                                {formatCurrency(analyticsData.averagePrice)}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                                Inventory average
                            </p>
                        </div>
                        <FaChartLine className="text-3xl text-teal-500" />
                    </div>
                </div>

                <div className={`p-6 rounded-lg ${getCardClasses()}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm ${theme.secondary} mb-1`}>Completed Deals</p>
                            <p className={`text-2xl font-bold ${theme.primary}`}>
                                {analyticsData.completedDeals}
                            </p>
                            <p className="text-sm text-green-600 flex items-center gap-1">
                                <FaArrowUp size={12} /> Sell requests
                            </p>
                        </div>
                        <FaUsers className="text-3xl text-green-500" />
                    </div>
                </div>

                <div className={`p-6 rounded-lg ${getCardClasses()}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm ${theme.secondary} mb-1`}>Items Sold</p>
                            <p className={`text-2xl font-bold ${theme.primary}`}>
                                {analyticsData.soldItems}
                            </p>
                            <p className="text-sm text-blue-600 flex items-center gap-1">
                                <FaBoxes size={12} /> From inventory
                            </p>
                        </div>
                        <FaBoxes className="text-3xl text-indigo-500" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Order Status Breakdown */}
                <div className={`p-6 rounded-lg ${getCardClasses()}`}>
                    <h2 className={`text-xl font-bold ${theme.cardText} mb-4`}>
                        Order Status Breakdown
                    </h2>
                    <div className="space-y-3">
                        {Object.entries(analyticsData.orderStatusBreakdown).map(([status, count]) => (
                            <div key={status} className={`flex items-center justify-between p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <div className="flex items-center gap-3">
                                    <span className={`w-3 h-3 rounded-full ${
                                        status === 'delivered' ? 'bg-green-500' :
                                        status === 'pending' ? 'bg-yellow-500' :
                                        status === 'cancelled' ? 'bg-red-500' :
                                        status === 'shipped' ? 'bg-blue-500' :
                                        status === 'paid' ? 'bg-purple-500' :
                                        'bg-gray-500'
                                    }`}></span>
                                    <p className={`font-semibold capitalize ${theme.cardText}`}>{status}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${theme.primary}`}>{count}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className={`p-6 rounded-lg ${getCardClasses()}`}>
                    <h2 className={`text-xl font-bold ${theme.cardText} mb-4`}>
                        Inventory by Category
                    </h2>
                    <div className="space-y-3">
                        {Object.keys(analyticsData.categoryBreakdown).length > 0 ? (
                            Object.entries(analyticsData.categoryBreakdown).map(([category, count]) => (
                                <div key={category} className={`flex items-center justify-between p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                    <p className={`font-semibold capitalize ${theme.cardText}`}>{category}</p>
                                    <div className="text-right">
                                        <p className={`font-bold ${theme.primary}`}>{count} devices</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className={`text-center py-4 ${theme.secondary}`}>No category data available</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Brand & Condition Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                {/* Brand Breakdown */}
                <div className={`p-6 rounded-lg ${getCardClasses()}`}>
                    <h2 className={`text-xl font-bold ${theme.cardText} mb-4`}>
                        Inventory by Brand
                    </h2>
                    <div className="space-y-3">
                        {Object.keys(analyticsData.brandBreakdown).length > 0 ? (
                            Object.entries(analyticsData.brandBreakdown).slice(0, 6).map(([brand, count]) => (
                                <div key={brand} className={`flex items-center justify-between p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                    <p className={`font-semibold ${theme.cardText}`}>{brand}</p>
                                    <div className="text-right">
                                        <p className={`font-bold ${theme.primary}`}>{count} devices</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className={`text-center py-4 ${theme.secondary}`}>No brand data available</p>
                        )}
                    </div>
                </div>

                {/* Condition Breakdown */}
                <div className={`p-6 rounded-lg ${getCardClasses()}`}>
                    <h2 className={`text-xl font-bold ${theme.cardText} mb-4`}>
                        Inventory by Condition
                    </h2>
                    <div className="space-y-3">
                        {Object.keys(analyticsData.conditionBreakdown).length > 0 ? (
                            Object.entries(analyticsData.conditionBreakdown).map(([condition, count]) => (
                                <div key={condition} className={`flex items-center justify-between p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                    <div className="flex items-center gap-3">
                                        <span className={`w-3 h-3 rounded-full ${
                                            condition === 'excellent' || condition === 'new' ? 'bg-green-500' :
                                            condition === 'good' ? 'bg-blue-500' :
                                            condition === 'fair' ? 'bg-yellow-500' :
                                            'bg-orange-500'
                                        }`}></span>
                                        <p className={`font-semibold capitalize ${theme.cardText}`}>{condition}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${theme.primary}`}>{count} devices</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className={`text-center py-4 ${theme.secondary}`}>No condition data available</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className={`mt-8 p-6 rounded-lg ${getCardClasses()}`}>
                <h2 className={`text-xl font-bold ${theme.cardText} mb-6`}>
                    Summary Overview
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                        <p className={`text-3xl font-bold ${theme.primary} mb-2`}>
                            {analyticsData.totalSellRequests}
                        </p>
                        <p className={`text-sm ${theme.secondary}`}>Total Sell Requests</p>
                    </div>
                    <div className="text-center">
                        <p className={`text-3xl font-bold ${theme.primary} mb-2`}>
                            {analyticsData.totalInventory}
                        </p>
                        <p className={`text-sm ${theme.secondary}`}>Total Inventory</p>
                    </div>
                    <div className="text-center">
                        <p className={`text-3xl font-bold ${theme.primary} mb-2`}>
                            {analyticsData.totalOrders}
                        </p>
                        <p className={`text-sm ${theme.secondary}`}>Total Orders</p>
                    </div>
                    <div className="text-center">
                        <p className={`text-3xl font-bold ${theme.primary} mb-2`}>
                            {formatCurrency(analyticsData.avgExpectedPrice)}
                        </p>
                        <p className={`text-sm ${theme.secondary}`}>Avg Expected Price</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesAnalytics;