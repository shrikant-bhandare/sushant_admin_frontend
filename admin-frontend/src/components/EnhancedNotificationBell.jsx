import React, { useState, useEffect, useRef } from 'react';
import { FaBell, FaTimes, FaCheck, FaCheckDouble, FaFilter, FaSpinner } from 'react-icons/fa';
import { useEnhancedNotifications } from '../hooks/useEnhancedNotifications';
import { toast } from 'react-toastify';

const EnhancedNotificationBell = () => {
  const {
    notifications,
    unreadCount,
    isConnected,
    loading,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
    handleNotificationClick,
    getFilteredNotifications,
    getUnreadCountByType
  } = useEnhancedNotifications();
  console.log("notification",notifications);

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        !bellRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load more notifications
  const loadMoreNotifications = async () => {
    if (loading || !hasMore) return;

    const result = await fetchNotifications(page + 1, 10);
    if (result.hasMore) {
      setPage(page + 1);
      setHasMore(result.hasMore);
    }
  };

  // Handle notification click
  const onNotificationClick = async (notification) => {
    try {
      const actionUrl = await handleNotificationClick(notification.id);
      
      // Navigate to action URL if exists
      if (actionUrl) {
        window.location.href = actionUrl;
      } else {
        // Default navigation based on type
        navigateBasedOnType(notification);
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error handling notification click:', error);
      toast.error('Error opening notification');
    }
  };

  // Navigate based on notification type
  const navigateBasedOnType = (notification) => {
    switch (notification.type) {
      case 'task_assigned_notification':
      case 'task_status_notification':
        window.location.href = '/tasks';
        break;
      case 'sale_order_status_notification':
        window.location.href = '/sale-orders';
        break;
      case 'inventory_approved_notification':
      case 'inventory_request_notification':
      case 'low_stock_alert':
      case 'inventory_update_notification':
        window.location.href = '/inventory';
        break;
      case 'part_request_created_notification':
      case 'part_request_approved_notification':
        window.location.href = '/part-requests';
        break;
      default:
        console.log('No specific navigation for:', notification.type);
    }
  };

  // Mark notification as read
  const onMarkAsRead = async (e, notificationId) => {
    e.stopPropagation();
    await markAsRead(notificationId);
    toast.success('Notification marked as read');
  };

  // Mark all as read
  const onMarkAllAsRead = async () => {
    await markAllAsRead();
    toast.success('All notifications marked as read');
  };

  // Get priority badge color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'normal':
        return 'bg-blue-500 text-white';
      case 'low':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    const iconMap = {
      task_assigned_notification: '👤',
      task_status_notification: '📋',
      inventory_approved_notification: '✅',
      inventory_request_notification: '📦',
      sale_order_status_notification: '🛍️',
      low_stock_alert: '⚠️',
      part_request_created_notification: '🔧',
      part_request_approved_notification: '✅',
      inventory_update_notification: '📊',
      system_alert: '🚨',
      test_notification: '🧪'
    };
    return iconMap[type] || '📢';
  };

  // Format time
  const formatTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const filteredNotifications = getFilteredNotifications(filter);
  const unreadCounts = getUnreadCountByType();

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        ref={bellRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-all duration-200 ${
          unreadCount > 0 
            ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50' 
            : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'
        } ${!isConnected ? 'opacity-50' : ''}`}
        title={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <FaBell className="w-6 h-6" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* Connection Status */}
        {!isConnected && (
          <span className="absolute -bottom-1 -right-1 bg-yellow-500 w-3 h-3 rounded-full border-2 border-white"></span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    title="Mark all as read"
                  >
                    <FaCheckDouble className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Connection Status */}
            <div className="flex items-center space-x-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mt-3">
              {[
                { key: 'all', label: 'All', count: notifications.length },
                { key: 'unread', label: 'Unread', count: unreadCounts.total },
                { key: 'urgent', label: 'Urgent', count: unreadCounts.urgent },
                { key: 'tasks', label: 'Tasks', count: unreadCounts.tasks },
                { key: 'inventory', label: 'Inventory', count: unreadCounts.inventory },
                { key: 'orders', label: 'Orders', count: unreadCounts.orders }
              ].map(filterOption => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key)}
                  className={`px-2 py-1 text-xs rounded-full transition-colors ${
                    filter === filterOption.key
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {filterOption.label} {filterOption.count > 0 && `(${filterOption.count})`}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <FaBell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No notifications found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => onNotificationClick(notification)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 text-lg">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-1 ml-2">
                            {/* Priority Badge */}
                            {notification.priority !== 'normal' && (
                              <span className={`px-1.5 py-0.5 text-xs rounded-full font-medium ${getPriorityColor(notification.priority)}`}>
                                {notification.priority}
                              </span>
                            )}
                            
                            {/* Read/Unread Status */}
                            {!notification.read && (
                              <button
                                onClick={(e) => onMarkAsRead(e, notification.id)}
                                className="text-blue-500 hover:text-blue-600"
                                title="Mark as read"
                              >
                                <FaCheck className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {notification.message}
                        </p>

                        {/* Metadata */}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(notification.createdAt)}
                          </span>
                          
                          {notification.triggeredBy && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              by {notification.triggeredBy.userName || notification.triggeredBy.name}
                            </span>
                          )}
                          
                          {notification.requiresAction && (
                            <span className="text-xs text-orange-500 font-medium">
                              Action Required
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Load More */}
            {hasMore && filteredNotifications.length > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={loadMoreNotifications}
                  disabled={loading}
                  className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <FaSpinner className="w-4 h-4 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedNotificationBell;
