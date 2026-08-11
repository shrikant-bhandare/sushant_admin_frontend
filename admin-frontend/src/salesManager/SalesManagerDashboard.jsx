import React, { useState, useEffect } from 'react';
import { 
  FaShoppingCart, 
  FaMobile, 
  FaChartLine, 
  FaBell, 
  FaClipboardList, 
  FaDollarSign,
  FaUsers,
  FaBoxes
} from 'react-icons/fa';
import { useTheme, useRoleTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import sellDeviceService from '../services/sellDeviceService';
import deviceInventoryService from '../services/deviceInventoryService';
import deviceOrderService from '../services/deviceOrderService';

const SalesManagerDashboard = () => {
    const { isDarkMode } = useTheme();
    const { theme, getCardClasses, getIconClasses } = useRoleTheme();
    const navigate = useNavigate();
    const { unreadCount } = useNotifications();
    
    const [dashboardData, setDashboardData] = useState({
        sellDeviceRequests: 0,
        deviceInventoryCount: 0,
        totalRevenue: 0,
        customerInquiries: 0,
        totalOrders: 0
    });
    const [quickStats, setQuickStats] = useState({
        todaysSales: 0,
        pendingReviews: 0,
        quotedToday: 0,
        stockItems: 0
    });
    const [loading, setLoading] = useState(true);

    // Fetch dashboard statistics
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                
                const [sellDeviceStats, inventoryStats, orderStats] = await Promise.allSettled([
                    sellDeviceService.getSellDeviceStatistics(),
                    deviceInventoryService.getDeviceStatistics(),
                    deviceOrderService.getOrderStatistics()
                ]);

                const sellStats = sellDeviceStats.status === 'fulfilled' ? (sellDeviceStats.value?.data || sellDeviceStats.value || {}) : {};
                const invStats = inventoryStats.status === 'fulfilled' ? (inventoryStats.value?.data || inventoryStats.value || {}) : {};
                const ordStats = orderStats.status === 'fulfilled' ? (orderStats.value?.data || orderStats.value || {}) : {};

                setDashboardData({
                    sellDeviceRequests: sellStats.pendingCount || 0,
                    deviceInventoryCount: invStats.totalDevices || 0,
                    totalRevenue: ordStats.totalRevenue || 0,
                    customerInquiries: sellStats.totalDevices || 0,
                    totalOrders: ordStats.total || 0
                });

                // Set quick stats
                setQuickStats({
                    todaysSales: ordStats.totalRevenue || 0,
                    pendingReviews: sellStats.pendingCount || 0,
                    quotedToday: sellStats.quotedCount || 0,
                    stockItems: invStats.activeCount || invStats.totalDevices || 0
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const cards = [
        { 
          title: 'Sell Device Requests', 
          description: 'Review and manage customer device sale requests.', 
          icon: <FaMobile />, 
          count: loading ? '...' : dashboardData.sellDeviceRequests, 
          route: '/sales-manager/sell-devices',
          color: 'text-blue-500'
        },
        { 
          title: 'Device Inventory', 
          description: 'Manage device inventory and stock levels.', 
          icon: <FaBoxes />, 
          count: loading ? '...' : dashboardData.deviceInventoryCount, 
          route: '/sales-manager/device-inventory',
          color: 'text-green-500'
        },
        { 
          title: 'Order List', 
          description: 'View all device purchase orders.', 
          icon: <FaClipboardList />, 
          count: loading ? '...' : dashboardData.totalOrders, 
          route: '/sales-manager/orders',
          color: 'text-teal-500'
        },
        { 
          title: 'Sales Analytics', 
          description: 'Track sales performance and trends.', 
          icon: <FaChartLine />, 
          count: loading ? '...' : '📈', 
          route: '/sales-manager/analytics',
          color: 'text-purple-500'
        },
        { 
          title: 'Revenue Overview', 
          description: 'Monitor total sales revenue and profits.', 
          icon: <FaDollarSign />, 
          count: loading ? '...' : `₹${dashboardData.totalRevenue.toLocaleString('en-IN')}`, 
          route: '/sales-manager/analytics',
          color: 'text-yellow-500'
        },
        { 
          title: 'Notifications', 
          description: 'Stay updated with sales notifications.', 
          icon: <FaBell />, 
          count: loading ? '...' : unreadCount, 
          route: '/sales-manager/notifications',
          color: 'text-red-500'
        },
        { 
          title: 'Customer Inquiries', 
          description: 'Handle customer questions and support.', 
          icon: <FaUsers />, 
          count: loading ? '...' : dashboardData.customerInquiries, 
          route: '/sales-manager/sell-devices',
          color: 'text-indigo-500'
        }
    ];

    const handleCardClick = (route) => {
        navigate(route);
    };

    return (
        <div className={`rounded-md p-6 ${theme.background}`}>
            <div className="mb-8">
                <h1 className={`text-3xl font-bold ${theme.primary}`}>
                    Sales Manager Dashboard
                </h1>
                <p className={`mt-2 ${theme.secondary}`}>
                    Manage device sales, inventory, and customer interactions
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card, index) => (
                    <div 
                        key={index} 
                        onClick={() => handleCardClick(card.route)}
                        className={`p-6 rounded-lg shadow-md cursor-pointer transition-all duration-200 transform hover:scale-105 ${getCardClasses()}`}
                    >
                        <div className="flex items-center mb-4">
                            <div className={`text-3xl mr-4 ${card.color}`}>
                                {card.icon}
                            </div>
                            <div>
                                <h2 className={`text-xl font-semibold ${theme.cardText}`}>
                                    {card.title}
                                </h2>
                                <p className={`text-sm font-bold ${theme.primary}`}>
                                    {typeof card.count === 'string' ? card.count : card.count.toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <p className={`${theme.secondary} text-sm`}>
                            {card.description}
                        </p>
                    </div>
                ))}
            </div>

            {/* Quick Stats Section */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-lg ${getCardClasses()}`}>
                    <h3 className={`text-lg font-semibold ${theme.cardText}`}>
                        Total Revenue
                    </h3>
                    <p className={`text-2xl font-bold ${theme.primary}`}>
                        {loading ? '...' : `₹${quickStats.todaysSales.toLocaleString('en-IN')}`}
                    </p>
                </div>
                <div className={`p-4 rounded-lg ${getCardClasses()}`}>
                    <h3 className={`text-lg font-semibold ${theme.cardText}`}>
                        Pending Reviews
                    </h3>
                    <p className={`text-2xl font-bold ${theme.primary}`}>
                        {loading ? '...' : quickStats.pendingReviews}
                    </p>
                </div>
                <div className={`p-4 rounded-lg ${getCardClasses()}`}>
                    <h3 className={`text-lg font-semibold ${theme.cardText}`}>
                        Quoted Devices
                    </h3>
                    <p className={`text-2xl font-bold ${theme.primary}`}>
                        {loading ? '...' : quickStats.quotedToday}
                    </p>
                </div>
                <div className={`p-4 rounded-lg ${getCardClasses()}`}>
                    <h3 className={`text-lg font-semibold ${theme.cardText}`}>
                        Stock Items
                    </h3>
                    <p className={`text-2xl font-bold ${theme.primary}`}>
                        {loading ? '...' : quickStats.stockItems}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SalesManagerDashboard;