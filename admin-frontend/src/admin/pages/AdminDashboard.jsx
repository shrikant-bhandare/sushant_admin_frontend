import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChartLine, FaUserFriends, FaMoneyBillWave, FaRegLightbulb, FaCog, FaShieldAlt, FaBell, FaEnvelope, FaChartBar, FaQuestionCircle, FaPlus, FaTicketAlt, FaTools, FaUserCog, FaArrowUp, FaArrowDown, FaCalendarAlt, FaSync, FaPause, FaPlay } from 'react-icons/fa';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

// No tabs needed now

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({});
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRealTimeActive, setIsRealTimeActive] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const intervalRef = useRef(null);
  const [chartData, setChartData] = useState({
    ticketTrends: [],
    revenueTrends: [],
    statusDistribution: [],
    monthlyPerformance: []
  });

  // Color scheme for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  useEffect(() => {
    fetchDashboardData();
    fetchChartData();
    
    // Set up real-time data refresh
    if (isRealTimeActive) {
      startRealTimeUpdates();
    }
    
    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRealTimeActive, refreshInterval]);

  // Start real-time updates
  const startRealTimeUpdates = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      fetchDashboardData(true); // true indicates it's a background refresh
      fetchChartData(true);
      setLastUpdated(new Date());
    }, refreshInterval * 1000);
  };

  // Stop real-time updates
  const stopRealTimeUpdates = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Toggle real-time updates
  const toggleRealTime = () => {
    setIsRealTimeActive(!isRealTimeActive);
    if (!isRealTimeActive) {
      startRealTimeUpdates();
    } else {
      stopRealTimeUpdates();
    }
  };

  // Manual refresh
  const handleManualRefresh = () => {
    fetchDashboardData();
    fetchChartData();
    setLastUpdated(new Date());
  };

  // Fetch dashboard data for highlights/cards
  const fetchDashboardData = async (isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) {
        setLoading(true);
      }
      
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/dashboard/dashboard-data`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Dashboard API Response:', data); // Debug log
      
      if (data.success) {
        setDashboardData(data);
        
        // Extract data from API response
        const highlights = data.highlights || [];
        
        // Map API data to cards
        setCards([
          { 
            title: 'Total Tickets', 
            description: 'All tickets in system', 
            icon: <FaTicketAlt />, 
            count: highlights.find(h => h.title === 'Total Tickets')?.value || 0,
            trend: '+12%',
            trendUp: true,
            color: 'from-blue-500 to-blue-600'
          },
          { 
            title: 'Active Users', 
            description: 'Currently active users', 
            icon: <FaUserFriends />, 
            count: highlights.find(h => h.title === 'Total Users')?.value || 0,
            trend: '+8%',
            trendUp: true,
            color: 'from-green-500 to-green-600'
          },
          { 
            title: 'Total Revenue', 
            description: 'Total completed amount', 
            icon: <FaMoneyBillWave />, 
            count: parseInt(highlights.find(h => h.title === 'Total Amount')?.value || '0'),
            trend: '+15%',
            trendUp: true,
            color: 'from-purple-500 to-purple-600'
          },
          { 
            title: 'Completed Tickets', 
            description: 'Successfully completed', 
            icon: <FaChartLine />, 
            count: highlights.find(h => h.title === 'Completed Tickets')?.value || 0,
            trend: '+5%',
            trendUp: true,
            color: 'from-orange-500 to-orange-600'
          },
          { 
            title: 'Open Tickets', 
            description: 'Pending resolution', 
            icon: <FaTools />, 
            count: highlights.find(h => h.title === 'Open Tickets')?.value || 0,
            trend: '-3%',
            trendUp: false,
            color: 'from-red-500 to-red-600'
          },
          { 
            title: 'Total Customers', 
            description: 'Registered customers', 
            icon: <FaUserCog />, 
            count: highlights.find(h => h.title === 'Total Customers')?.value || 0,
            trend: '+2%',
            trendUp: true,
            color: 'from-indigo-500 to-indigo-600'
          }
        ]);
      } else {
        console.error('Dashboard API error:', data.message);
        // Fallback to mock data if API fails
        setCards([
          { title: 'Total Tickets', description: 'All tickets in system', icon: <FaTicketAlt />, count: 0, trend: '0%', trendUp: true, color: 'from-blue-500 to-blue-600' },
          { title: 'Active Users', description: 'Currently active users', icon: <FaUserFriends />, count: 0, trend: '0%', trendUp: true, color: 'from-green-500 to-green-600' },
          { title: 'Total Revenue', description: 'Total completed amount', icon: <FaMoneyBillWave />, count: 0, trend: '0%', trendUp: true, color: 'from-purple-500 to-purple-600' },
          { title: 'Completed Tickets', description: 'Successfully completed', icon: <FaChartLine />, count: 0, trend: '0%', trendUp: true, color: 'from-orange-500 to-orange-600' },
          { title: 'Open Tickets', description: 'Pending resolution', icon: <FaTools />, count: 0, trend: '0%', trendUp: false, color: 'from-red-500 to-red-600' },
          { title: 'Total Customers', description: 'Registered customers', icon: <FaUserCog />, count: 0, trend: '0%', trendUp: true, color: 'from-indigo-500 to-indigo-600' }
        ]);
      }
      
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
      // Fallback to mock data on error
      setCards([
        { title: 'Total Tickets', description: 'All tickets in system', icon: <FaTicketAlt />, count: 0, trend: '0%', trendUp: true, color: 'from-blue-500 to-blue-600' },
        { title: 'Active Users', description: 'Currently active users', icon: <FaUserFriends />, count: 0, trend: '0%', trendUp: true, color: 'from-green-500 to-green-600' },
        { title: 'Total Revenue', description: 'Total completed amount', icon: <FaMoneyBillWave />, count: 0, trend: '0%', trendUp: true, color: 'from-purple-500 to-purple-600' },
        { title: 'Completed Tickets', description: 'Successfully completed', icon: <FaChartLine />, count: 0, trend: '0%', trendUp: true, color: 'from-orange-500 to-orange-600' },
        { title: 'Open Tickets', description: 'Pending resolution', icon: <FaTools />, count: 0, trend: '0%', trendUp: false, color: 'from-red-500 to-red-600' },
        { title: 'Total Customers', description: 'Registered customers', icon: <FaUserCog />, count: 0, trend: '0%', trendUp: true, color: 'from-indigo-500 to-indigo-600' }
      ]);
    }
  };

  // Fetch chart data with real-time simulation
  const fetchChartData = async (isBackgroundRefresh = false) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch real chart data from backend
      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/dashboard/dashboard-data`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      console.log('Full API response:', data);
      console.log('Graph data:', data.graphs);
      
      if (data.success && data.graphs) {
        const { revenueData, completedTicketsData, allTicketsData, monthlyPerformanceData, statusDistribution } = data.graphs;
        
        console.log('Revenue data from API:', revenueData);
        console.log('All tickets data from API:', allTicketsData);
        console.log('Completed tickets data from API:', completedTicketsData);
        
        console.log('Graph data received:', { revenueData, completedTicketsData, allTicketsData, monthlyPerformanceData });

        // Process revenue data for charts - show last 7 days with complete timeline
        const processedRevenueData = [];
        
        // Create array of last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
          const dayName = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          
          // Find revenue for this day
          const dayRevenue = revenueData?.find(item => item._id === dateString)?.totalRevenue || 0;
          
          processedRevenueData.push({
            name: dayName,
            revenue: dayRevenue
          });
        }
        
        console.log('Processed revenue data:', processedRevenueData);        // Process ticket trends data - show last 7 days with total vs completed
        const processedTicketData = [];
        const last7Days = [];
        
        // Create array of last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
          last7Days.push({
            date: dateString,
            name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          });
        }
        
        console.log('Last 7 days:', last7Days);
        console.log('All tickets data:', allTicketsData);
        console.log('Completed tickets data:', completedTicketsData);
        
        // Match data to dates
        last7Days.forEach(day => {
          const totalTickets = allTicketsData?.find(item => item._id === day.date)?.count || 0;
          const completedTickets = completedTicketsData?.find(item => item._id === day.date)?.count || 0;
          
          processedTicketData.push({
            name: day.name,
            tickets: totalTickets,
            completed: completedTickets
          });
        });
        
        console.log('Processed ticket data:', processedTicketData);
        
        // Process monthly performance data from API
        const processedMonthlyPerformance = monthlyPerformanceData?.map(item => {
          const date = new Date(item._id + '-01'); // Add day to make it a valid date
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });
          const completionRate = item.totalTickets > 0 ? Math.round((item.completedTickets / item.totalTickets) * 100) : 0;
          
          return {
            month: monthName,
            target: 100, // Target completion rate is 100%
            achieved: completionRate
          };
        }) || [];
        
        console.log('Monthly performance data:', monthlyPerformanceData);
        console.log('Processed monthly performance:', processedMonthlyPerformance);
        
        // Process status distribution from actual data
        const statusColors = {
          'Completed': '#00C49F',
          'Open': '#FF8042', 
          'In Progress': '#FFBB28',
          'Working': '#FFBB28',
          'Pending': '#8884D8',
          'Cancelled': '#FF6B6B'
        };
        
        const processedStatusDistribution = statusDistribution?.map(item => ({
          name: item._id || 'Unknown',
          value: item.count || 0,
          color: statusColors[item._id] || '#8884D8'
        })) || [];
        
        console.log('Status distribution:', processedStatusDistribution);
        
        setChartData({
          ticketTrends: processedTicketData.length > 0 ? processedTicketData : [],
          revenueTrends: processedRevenueData.length > 0 ? processedRevenueData : [],
          statusDistribution: processedStatusDistribution.length > 0 ? processedStatusDistribution : [],
          monthlyPerformance: processedMonthlyPerformance.length > 0 ? processedMonthlyPerformance : []
        });
        
        console.log('Final chart data set:', {
          ticketTrends: processedTicketData,
          revenueTrends: processedRevenueData,
          statusDistribution: processedStatusDistribution,
          monthlyPerformance: processedMonthlyPerformance
        });
      } else {
        // If no data from API, show empty charts
        setChartData({
          ticketTrends: [],
          revenueTrends: [],
          statusDistribution: [],
          monthlyPerformance: []
        });
      }
    } catch (error) {
      console.error('Chart data fetch error:', error);
      // Show empty charts on error
      setChartData({
        ticketTrends: [],
        revenueTrends: [],
        statusDistribution: [],
        monthlyPerformance: []
      });
    }
  };

  // No summary or user fetch needed

  // Handler for 'More' button
  const handleCardMoreClick = (title) => {
    // Map card titles to routes or tabs
    switch (title) {
      case 'Active Users':
      case 'Add Users':
      case 'Total Users':
        navigate('/admin/users');
        break;
      case 'Technicians':
        navigate('/admin/technician-work-history');
        break;
      case 'Monthly Revenue':
        navigate('/admin/billing');
        break;
      case 'Completed Today':
      case 'Open Tickets':
      case 'Total Tickets':
        navigate('/admin/repair_history');
        break;
      default:
        // You can add more mappings as needed
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Real-time Controls */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Real-time overview of your system</p>
            </div>
            
            {/* Real-time Controls */}
            <div className="flex items-center gap-4">
              {/* Last Updated */}
              <div className="text-sm text-gray-500">
                <FaCalendarAlt className="inline mr-1" />
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
              
              {/* Refresh Interval Selector */}
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={10}>10 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute</option>
                <option value={300}>5 minutes</option>
              </select>
              
              {/* Real-time Toggle */}
              <button
                onClick={toggleRealTime}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isRealTimeActive
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {isRealTimeActive ? <FaPause className="mr-1" /> : <FaPlay className="mr-1" />}
                {isRealTimeActive ? 'Real-time ON' : 'Real-time OFF'}
              </button>
              
              {/* Manual Refresh */}
              <button
                onClick={handleManualRefresh}
                className="flex items-center px-3 py-2 bg-blue-100 text-blue-800 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors"
              >
                <FaSync className="mr-1" />
                Refresh
              </button>
            </div>
          </div>
        </div>
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {cards.map((card, index) => (
            <div
              key={index}
              className={`bg-gradient-to-r ${card.color} rounded-xl shadow-lg p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="text-3xl opacity-80">{card.icon}</div>
                  {isRealTimeActive && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Real-time data"></div>
                  )}
                </div>
                <div className={`flex items-center text-sm ${card.trendUp ? 'text-green-200' : 'text-red-200'}`}>
                  {card.trendUp ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
                  {card.trend}
                </div>
              </div>
              <div className="mb-2">
                <h3 className="text-lg font-semibold">{card.title}</h3>
                <p className="text-sm opacity-80">{card.description}</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">
                  {card.title === 'Total Revenue' ? `₹${card.count.toLocaleString()}` : card.count.toLocaleString()}
                </div>
                <button
                  className="px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-200 text-sm font-medium"
                  onClick={() => handleCardMoreClick(card.title)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Ticket Trends Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Daily Ticket Trends</h3>
              {isRealTimeActive && (
                <div className="flex items-center text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                  Live
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.ticketTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="tickets" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="completed" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Trends Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Daily Revenue Trends</h3>
              {isRealTimeActive && (
                <div className="flex items-center text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                  Live
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.revenueTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Ticket Status Distribution</h3>
              {isRealTimeActive && (
                <div className="flex items-center text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                  Live
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Performance Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Monthly Performance</h3>
              {isRealTimeActive && (
                <div className="flex items-center text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                  Live
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.monthlyPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="target" fill="#8884d8" name="Target" />
                <Bar dataKey="achieved" fill="#82ca9d" name="Achieved" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/admin/users')}
              className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200 text-center"
            >
              <FaUserFriends className="text-2xl text-blue-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-700">Manage Users</div>
            </button>
            <button 
              onClick={() => navigate('/admin/billing')}
              className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200 text-center"
            >
              <FaMoneyBillWave className="text-2xl text-green-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-700">View Billing</div>
            </button>
            <button 
              onClick={() => navigate('/admin/repair_history')}
              className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors duration-200 text-center"
            >
              <FaTools className="text-2xl text-orange-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-700">Repair History</div>
            </button>
            <button 
              onClick={() => navigate('/admin/notifications')}
              className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200 text-center"
            >
              <FaBell className="text-2xl text-purple-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-700">Notifications</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
