import React, { useState, useEffect } from 'react';
import * as Icons from 'react-icons/fa'; // Import all icons from react-icons
import { FaChartLine, FaUsers, FaTicketAlt, FaDollarSign, FaArrowUp, FaClock, FaCheckCircle, FaExclamationTriangle, FaCalendarAlt, FaArrowDown, FaEye, FaStar, FaTools } from 'react-icons/fa';
import { useTheme, useRoleTheme } from '../context/ThemeContext';
import { Line, Doughnut, Bar } from 'react-chartjs-2'; // Import charts from react-chartjs-2
import CountUp from 'react-countup'; // Import CountUp for animations
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    BarElement,
    Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement, Filler);

const ReceptionistDashboard = () => {
    const { isDarkMode } = useTheme();
    const { theme, getCardClasses, getIconClasses } = useRoleTheme();

    const [highlights, setHighlights] = useState([]);
    const [cards, setCards] = useState([]);
    const [revenueData, setRevenueData] = useState([]);
    const [completedTicketsData, setCompletedTicketsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [previousData, setPreviousData] = useState({ highlights: [], cards: [] });

    // Fetch data dynamically
    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${import.meta.env.VITE_APIURL}/api/dashboard/dashboard-data`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
                });
                const data = await response.json();
                console.log("Response data:", data); // Log the response data
                if (data.success) {
                    setHighlights(data.highlights || []);
                    setCards(data.cards || []);
                    setRevenueData(data.graphs.revenueData || []);
                    setCompletedTicketsData(data.graphs.completedTicketsData || []);
                    
                    // Store previous data for percentage calculation (you can also get this from API)
                    if (data.previousData) {
                        setPreviousData(data.previousData);
                    }
                    
                    console.log("Dashboard data fetched successfully:", data);
                } else {
                    console.error("Failed to fetch dashboard data:", data.message);
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const renderIcon = (iconName) => {
        const IconComponent = Icons[iconName];
        return IconComponent ? (
            <div className={`p-4 rounded-2xl transition-all duration-300 ${
                isDarkMode 
                    ? 'bg-gradient-to-br from-purple-600/20 to-blue-600/20 text-purple-400' 
                    : 'bg-gradient-to-br from-purple-100 to-blue-100 text-purple-600'
            }`}>
                <IconComponent className="text-2xl" />
            </div>
        ) : (
            <div className={`p-4 rounded-2xl ${
                isDarkMode 
                    ? 'bg-gradient-to-br from-gray-600/20 to-gray-700/20 text-gray-400' 
                    : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600'
            }`}>
                <FaTools className="text-2xl" />
            </div>
        );
    };

    const getMetricColor = (index) => {
        const colors = [
            { bg: 'from-blue-500 to-blue-600', icon: 'text-blue-100' },
            { bg: 'from-green-500 to-green-600', icon: 'text-green-100' },
            { bg: 'from-purple-500 to-purple-600', icon: 'text-purple-100' },
            { bg: 'from-orange-500 to-orange-600', icon: 'text-orange-100' },
            { bg: 'from-pink-500 to-pink-600', icon: 'text-pink-100' },
            { bg: 'from-indigo-500 to-indigo-600', icon: 'text-indigo-100' },
        ];
        return colors[index % colors.length];
    };

    const calculatePercentageChange = (current, previous) => {
        if (!previous || previous === 0) return { percentage: '0%', positive: true };
        
        const change = ((current - previous) / previous) * 100;
        const isPositive = change >= 0;
        const formattedChange = `${isPositive ? '+' : ''}${change.toFixed(1)}%`;
        
        return { percentage: formattedChange, positive: isPositive };
    };

    const getMetricPercentage = (item, index, type = 'highlights') => {
        const previousItem = type === 'highlights' 
            ? previousData.highlights[index] 
            : previousData.cards[index];
            
        if (!previousItem) {
            return { percentage: '0%', positive: true };
        }
        
        const currentValue = type === 'highlights' ? item.value : item.count;
        const previousValue = type === 'highlights' ? previousItem.value : previousItem.count;
        
        return calculatePercentageChange(currentValue, previousValue);
    };

    const getMetricTrend = (isPositive) => {
        return {
            icon: isPositive ? FaArrowUp : FaArrowDown,
            positive: isPositive
        };
    };

    // Prepare data for revenue graph
    const revenueChartData = {
        labels: revenueData.map((item) => item._id),
        datasets: [
            {
                label: 'Revenue',
                data: revenueData.map((item) => item.totalRevenue),
                borderColor: 'rgba(59, 130, 246, 1)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
            },
        ],
    };

    // Prepare data for completed tickets graph
    const completedTicketsChartData = {
        labels: completedTicketsData.map((item) => item._id),
        datasets: [
            {
                label: 'Completed Tickets',
                data: completedTicketsData.map((item) => item.count),
                borderColor: 'rgba(16, 185, 129, 1)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
            },
        ],
    };

    // Chart options
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    color: isDarkMode ? '#e5e7eb' : '#374151',
                    font: {
                        size: 12,
                        weight: '500',
                    },
                },
            },
            tooltip: {
                backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                titleColor: isDarkMode ? '#ffffff' : '#111827',
                bodyColor: isDarkMode ? '#e5e7eb' : '#374151',
                borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                padding: 12,
            },
        },
        scales: {
            x: {
                grid: {
                    color: isDarkMode ? '#374151' : '#f3f4f6',
                    borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
                },
                ticks: {
                    color: isDarkMode ? '#9ca3af' : '#6b7280',
                    font: {
                        size: 11,
                    },
                },
            },
            y: {
                grid: {
                    color: isDarkMode ? '#374151' : '#f3f4f6',
                    borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
                },
                ticks: {
                    color: isDarkMode ? '#9ca3af' : '#6b7280',
                    font: {
                        size: 11,
                    },
                },
            },
        },
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <div className="text-center">
                    <div className={`inline-block animate-spin rounded-full h-12 w-12 border-b-2 ${isDarkMode ? 'border-purple-400' : 'border-purple-600'}`}></div>
                    <p className={`mt-4 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen p-6 transition-all duration-300 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
            {/* Header Section */}
            <div className="mb-8">
                <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700 border-gray-700' : 'bg-gradient-to-r from-white to-gray-50 border-gray-200'} shadow-xl`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg`}>
                                <FaChartLine className="text-2xl text-white" />
                            </div>
                            <div>
                                <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Reception Dashboard
                                </h1>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Welcome back! Here's what's happening today.
                                </p>
                            </div>
                        </div>
                        <div className={`px-4 py-2 rounded-xl ${isDarkMode ? 'bg-purple-600/20 text-purple-300 border border-purple-600/30' : 'bg-purple-100 text-purple-700 border border-purple-200'}`}>
                            <div className="flex items-center gap-2">
                                <FaCalendarAlt className="text-sm" />
                                <span className="text-sm font-medium">{new Date().toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Metrics Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {highlights.map((highlight, index) => {
                    const colorScheme = getMetricColor(index);
                    const percentageData = getMetricPercentage(highlight, index, 'highlights');
                    const trend = getMetricTrend(percentageData.positive);
                    const TrendIcon = trend.icon;
                    
                    // We want to not show Total Amount and today's total amount
                    if (highlight.title === 'Total Amount' || highlight.title === "Today's Total Amount") {
                        return null; // Skip rendering this highlight
                    }
                    return (
                        <div key={index} className={`group relative overflow-hidden rounded-2xl bg-gradient-to-r ${colorScheme.bg} p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300`}>
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-xl bg-white/20 backdrop-blur-sm ${colorScheme.icon}`}>
                                        {renderIcon(highlight.icon)}
                                    </div>
                                    <div className="text-right">
                                        <div className={`flex items-center gap-1 text-sm ${
                                            percentageData.positive ? 'text-white/90' : 'text-red-200'
                                        }`}>
                                            {/* <TrendIcon className="text-xs" /> */}
                                            {/* <span>{percentageData.percentage}</span> */}
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-white/90 text-sm font-medium mb-2">{highlight.title}</h3>
                                <p className="text-3xl font-bold text-white">
                                    <CountUp end={highlight.value} duration={2} separator="," />
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Secondary Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {cards.map((card, index) => {
                    const percentageData = getMetricPercentage(card, index, 'cards');
                    const trend = getMetricTrend(percentageData.positive);
                    const TrendIcon = trend.icon;
                    
                    return (
                        <div key={index} className={`group p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                            isDarkMode 
                                ? 'bg-gradient-to-br from-gray-800 to-gray-700 border-gray-700 hover:border-gray-600' 
                                : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-gray-300'
                        } shadow-lg`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
                                    isDarkMode 
                                        ? 'bg-gradient-to-br from-purple-600/20 to-blue-600/20' 
                                        : 'bg-gradient-to-br from-purple-100 to-blue-100'
                                }`}>
                                    {renderIcon(card.icon)}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        isDarkMode 
                                            ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
                                            : 'bg-green-100 text-green-700 border border-green-200'
                                    }`}>
                                        Active
                                    </div>
                                    <div className={`flex items-center gap-1 text-xs ${
                                        percentageData.positive 
                                            ? isDarkMode ? 'text-green-400' : 'text-green-600'
                                            : isDarkMode ? 'text-red-400' : 'text-red-600'
                                    }`}>
                                        {/* <TrendIcon className="text-xs" /> */}
                                        {/* <span>{percentageData.percentage}</span> */}
                                    </div>
                                </div>
                            </div>
                            <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {card.title}
                            </h3>
                            <div className="flex items-center gap-2 mb-3">
                                <p className={`text-2xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                                    <CountUp end={card.count} duration={2} separator="," />
                                </p>
                                <div className="flex items-center gap-1 text-xs">
                                    <FaEye className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                    <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>views</span>
                                </div>
                            </div>
                            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {card.description}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Revenue Chart */}
                <div className={`p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl ${
                    isDarkMode 
                        ? 'bg-gradient-to-br from-gray-800 to-gray-700 border-gray-700' 
                        : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
                } shadow-lg`}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                                <FaDollarSign className="text-lg" />
                            </div>
                            <div>
                                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Revenue Trends
                                </h3>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Last 7 days performance
                                </p>
                            </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            isDarkMode 
                                ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
                                : 'bg-green-100 text-green-700 border border-green-200'
                        }`}>
                            <div className="flex items-center gap-1">
                                <FaArrowUp className="text-xs" />
                                <span>+15.3%</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-80">
                        <Line data={revenueChartData} options={chartOptions} />
                    </div>
                </div>

                {/* Completed Tickets Chart */}
                <div className={`p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl ${
                    isDarkMode 
                        ? 'bg-gradient-to-br from-gray-800 to-gray-700 border-gray-700' 
                        : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
                } shadow-lg`}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                                <FaCheckCircle className="text-lg" />
                            </div>
                            <div>
                                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Completed Tickets
                                </h3>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Resolution tracking
                                </p>
                            </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            isDarkMode 
                                ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' 
                                : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                            <div className="flex items-center gap-1">
                                <FaClock className="text-xs" />
                                <span>Real-time</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-80">
                        <Line data={completedTicketsChartData} options={chartOptions} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceptionistDashboard;