import React, { useState, useEffect } from 'react';
import { FaBell, FaCheck, FaTrash, FaFilter } from 'react-icons/fa';
import { useTheme, useRoleTheme } from '../context/ThemeContext';
import { useNotifications } from '../hooks/useNotifications';

const Notifications = () => {
    const { isDarkMode } = useTheme();
    const { theme, getCardClasses, getIconClasses } = useRoleTheme();
    const { 
        notifications, 
        unreadCount, 
        loading, 
        markAsRead, 
        markAllAsRead, 
        refreshNotifications 
    } = useNotifications();
    
    const [filter, setFilter] = useState('all');

    // Filter notifications based on selected filter
    const filteredNotifications = notifications.filter(notification => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !notification.read;
        if (filter === 'read') return notification.read;
        return notification.type === filter;
    });

    const getNotificationIcon = (type) => {
        const icons = {
            sale_request: '📱',
            inventory_alert: '📦',
            sale_completed: '✅', 
            price_alert: '💰',
            system: '⚙️'
        };
        return icons[type] || '📢';
    };

    const getPriorityBadge = (priority) => {
        const badges = {
            high: 'bg-red-100 text-red-800',
            normal: 'bg-blue-100 text-blue-800',
            low: 'bg-gray-100 text-gray-800'
        };
        return badges[priority] || 'bg-gray-100 text-gray-800';
    };

    const handleMarkAsRead = (id) => {
        markAsRead(id);
    };

    const handleMarkAllAsRead = () => {
        markAllAsRead();
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    };

    if (loading) {
        return (
            <div className={`p-6 ${theme.background} min-h-screen`}>
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <span className="ml-2">Loading notifications...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`p-6 ${theme.background} min-h-screen`}>
            <div className="mb-8">
                <h1 className={`text-3xl font-bold ${theme.primary} mb-2`}>
                    Notifications
                </h1>
                <p className={`${theme.secondary}`}>
                    Stay updated with sales and inventory notifications
                </p>
            </div>

            {/* Filter and Actions */}
            <div className={`mb-6 p-4 rounded-lg ${getCardClasses()}`}>
                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <FaFilter className={theme.primary} />
                            <select 
                                value={filter} 
                                onChange={(e) => setFilter(e.target.value)}
                                className="border rounded px-3 py-1"
                            >
                                <option value="all">All Notifications</option>
                                <option value="unread">Unread</option>
                                <option value="read">Read</option>
                                <option value="sale_request">Sale Requests</option>
                                <option value="inventory_alert">Inventory Alerts</option>
                                <option value="sale_completed">Completed Sales</option>
                                <option value="price_alert">Price Alerts</option>
                            </select>
                        </div>
                        <div className={`text-sm ${theme.secondary}`}>
                            {filteredNotifications.length} notification(s)
                        </div>
                    </div>
                    <button
                        onClick={handleMarkAllAsRead}
                        className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2`}
                    >
                        <FaCheck /> Mark All Read
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                    <div 
                        key={notification.id} 
                        className={`p-4 rounded-lg border-l-4 ${
                            notification.read 
                                ? 'bg-gray-50 border-l-gray-300' 
                                : `${getCardClasses()} border-l-purple-500`
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                                <div className="text-2xl">
                                    {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className={`font-semibold ${notification.read ? 'text-gray-600' : theme.cardText}`}>
                                            {notification.title}
                                        </h3>
                                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityBadge(notification.priority)}`}>
                                            {notification.priority}
                                        </span>
                                    </div>
                                    <p className={`${notification.read ? 'text-gray-500' : theme.secondary} mb-2`}>
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {formatTimeAgo(notification.createdAt)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                                {!notification.read && (
                                    <button
                                        onClick={() => handleMarkAsRead(notification.id)}
                                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                        title="Mark as read"
                                    >
                                        <FaCheck />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {filteredNotifications.length === 0 && (
                    <div className={`p-8 text-center ${getCardClasses()}`}>
                        <FaBell className={`mx-auto mb-4 text-4xl ${theme.secondary}`} />
                        <h3 className={`text-lg font-semibold ${theme.cardText} mb-2`}>
                            No notifications found
                        </h3>
                        <p className={theme.secondary}>
                            {filter === 'all' 
                                ? "You're all caught up! No notifications at this time."
                                : `No ${filter} notifications found.`
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;