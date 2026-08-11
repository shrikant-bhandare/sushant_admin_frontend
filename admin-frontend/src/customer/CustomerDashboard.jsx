import React from 'react';
import { FaShoppingCart, FaClipboardList, FaBell, FaChartPie, FaComments, FaEnvelopeOpenText, FaQuestionCircle, FaArrowRight, FaArrowUp, FaClock, FaCheckCircle } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';

const CustomerDashboard = () => {
    const { isDarkMode } = useTheme();

    const dashboardStats = [
        { 
            title: 'Active Orders', 
            description: 'Orders currently being processed', 
            icon: <FaShoppingCart />, 
            count: 3,
            trend: '+2 this week',
            color: 'blue',
            status: 'processing'
        },
        { 
            title: 'Order History', 
            description: 'Total completed orders', 
            icon: <FaClipboardList />, 
            count: 45,
            trend: '+12 this month',
            color: 'green',
            status: 'completed'
        },
        { 
            title: 'Notifications', 
            description: 'Unread notifications', 
            icon: <FaBell />, 
            count: 8,
            trend: '5 new today',
            color: 'yellow',
            status: 'new'
        },
        { 
            title: 'Repair Analytics', 
            description: 'Device repair insights', 
            icon: <FaChartPie />, 
            count: 12,
            trend: 'avg 2.5 days',
            color: 'purple',
            status: 'analytics'
        },
        { 
            title: 'Support Messages', 
            description: 'Conversations with support', 
            icon: <FaComments />, 
            count: 10,
            trend: '2 unread',
            color: 'indigo',
            status: 'messages'
        },
        { 
            title: 'Email Updates', 
            description: 'Service notifications', 
            icon: <FaEnvelopeOpenText />, 
            count: 5,
            trend: 'last 7 days',
            color: 'pink',
            status: 'emails'
        }
    ];

    const getColorClasses = (color) => {
        const colors = {
            blue: {
                bg: isDarkMode ? 'from-blue-600/20 to-blue-700/10' : 'from-blue-50 to-blue-100',
                icon: isDarkMode ? 'bg-blue-600/30 text-blue-300' : 'bg-blue-100 text-blue-600',
                accent: isDarkMode ? 'text-blue-300' : 'text-blue-600',
                border: isDarkMode ? 'border-blue-600/30' : 'border-blue-200'
            },
            green: {
                bg: isDarkMode ? 'from-green-600/20 to-green-700/10' : 'from-green-50 to-green-100',
                icon: isDarkMode ? 'bg-green-600/30 text-green-300' : 'bg-green-100 text-green-600',
                accent: isDarkMode ? 'text-green-300' : 'text-green-600',
                border: isDarkMode ? 'border-green-600/30' : 'border-green-200'
            },
            yellow: {
                bg: isDarkMode ? 'from-yellow-600/20 to-yellow-700/10' : 'from-yellow-50 to-yellow-100',
                icon: isDarkMode ? 'bg-yellow-600/30 text-yellow-300' : 'bg-yellow-100 text-yellow-600',
                accent: isDarkMode ? 'text-yellow-300' : 'text-yellow-600',
                border: isDarkMode ? 'border-yellow-600/30' : 'border-yellow-200'
            },
            purple: {
                bg: isDarkMode ? 'from-purple-600/20 to-purple-700/10' : 'from-purple-50 to-purple-100',
                icon: isDarkMode ? 'bg-purple-600/30 text-purple-300' : 'bg-purple-100 text-purple-600',
                accent: isDarkMode ? 'text-purple-300' : 'text-purple-600',
                border: isDarkMode ? 'border-purple-600/30' : 'border-purple-200'
            },
            indigo: {
                bg: isDarkMode ? 'from-indigo-600/20 to-indigo-700/10' : 'from-indigo-50 to-indigo-100',
                icon: isDarkMode ? 'bg-indigo-600/30 text-indigo-300' : 'bg-indigo-100 text-indigo-600',
                accent: isDarkMode ? 'text-indigo-300' : 'text-indigo-600',
                border: isDarkMode ? 'border-indigo-600/30' : 'border-indigo-200'
            },
            pink: {
                bg: isDarkMode ? 'from-pink-600/20 to-pink-700/10' : 'from-pink-50 to-pink-100',
                icon: isDarkMode ? 'bg-pink-600/30 text-pink-300' : 'bg-pink-100 text-pink-600',
                accent: isDarkMode ? 'text-pink-300' : 'text-pink-600',
                border: isDarkMode ? 'border-pink-600/30' : 'border-pink-200'
            }
        };
        return colors[color] || colors.blue;
    };

    return (
        <div className={`min-h-screen p-4 sm:p-6 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
            {/* Header Section */}
            <div className="mb-8">
                <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-700' : 'bg-gradient-to-r from-white to-gray-50 border border-gray-200'} shadow-xl`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Customer Dashboard
                            </h1>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Welcome back! Here's an overview of your repair services and orders.
                            </p>
                        </div>
                        <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                            <FaCheckCircle className={`text-2xl ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {dashboardStats.map((stat, index) => {
                    const colors = getColorClasses(stat.color);
                    return (
                        <div 
                            key={index} 
                            className={`group relative p-6 rounded-2xl bg-gradient-to-br ${colors.bg} border ${colors.border} shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer ${isDarkMode ? 'hover:bg-gray-800/50' : 'hover:bg-white/80'}`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl ${colors.icon} shadow-md`}>
                                    <div className="text-xl">{stat.icon}</div>
                                </div>
                                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                                    <FaArrowRight className={`text-sm ${colors.accent}`} />
                                </div>
                            </div>
                            
                            <div className="mb-3">
                                <h3 className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {stat.title}
                                </h3>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {stat.description}
                                </p>
                            </div>
                            
                            <div className="flex items-end justify-between">
                                <div>
                                    <div className={`text-2xl font-bold ${colors.accent} mb-1`}>
                                        {stat.count.toLocaleString()}
                                    </div>
                                    <div className={`flex items-center text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        <FaArrowUp className="mr-1" size={10} />
                                        {stat.trend}
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${colors.icon}`}>
                                    {stat.status}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions Section */}
            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-700' : 'bg-gradient-to-r from-white to-gray-50 border border-gray-200'} shadow-xl`}>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className={`text-xl font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Quick Actions
                        </h2>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Common tasks and shortcuts
                        </p>
                    </div>
                    <FaClock className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { name: 'New Service Request', icon: <FaShoppingCart />, color: 'blue' },
                        { name: 'Track Repair Status', icon: <FaClipboardList />, color: 'green' },
                        { name: 'Contact Support', icon: <FaComments />, color: 'purple' },
                        { name: 'Help Center', icon: <FaQuestionCircle />, color: 'indigo' }
                    ].map((action, index) => {
                        const colors = getColorClasses(action.color);
                        return (
                            <button 
                                key={index}
                                className={`p-4 rounded-xl bg-gradient-to-br ${colors.bg} border ${colors.border} hover:shadow-lg transition-all duration-300 transform hover:scale-105 group`}
                            >
                                <div className={`p-2 rounded-lg ${colors.icon} mb-3 mx-auto w-fit`}>
                                    <div className="text-lg">{action.icon}</div>
                                </div>
                                <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} group-hover:${colors.accent} transition-colors duration-300`}>
                                    {action.name}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CustomerDashboard;