import React, { useState, useEffect } from 'react';
import { FaBell, FaFilter, FaCheck, FaCheckDouble, FaEye, FaTrash, FaSyncAlt, FaExternalLinkAlt } from 'react-icons/fa';
import { useEnhancedNotifications } from '../../hooks/useEnhancedNotifications';
import { toast } from 'react-toastify';

const EnhancedNotificationPage = () => {
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
    getNotificationsByPriority,
    getUnreadCountByType,
    refreshNotifications
  } = useEnhancedNotifications();

  const [currentFilter, setCurrentFilter] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async (pageNum = 1) => {
    const result = await fetchNotifications(pageNum, 20);
    setHasMore(result.hasMore);
    if (pageNum === 1) {
      setPage(1);
    }
  };

  const loadMoreNotifications = async () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    const result = await fetchNotifications(nextPage, 20);
    setPage(nextPage);
    setHasMore(result.hasMore);
  };

  // Handle notification click
  const onNotificationClick = async (notification) => {
    try {
      const actionUrl = await handleNotificationClick(notification.id);
      if (actionUrl) {
        window.location.href = actionUrl;
      } else {
        navigateBasedOnType(notification);
      }
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
        window.location.href = `/tasks?taskId=${notification.relatedData?.taskId || ''}`;
        break;
      case 'sale_order_status_notification':
        window.location.href = `/sale-orders?orderId=${notification.relatedData?.saleOrderId || ''}`;
        break;
      case 'inventory_approved_notification':
      case 'inventory_request_notification':
      case 'low_stock_alert':
      case 'inventory_update_notification':
        window.location.href = `/inventory?partId=${notification.relatedData?.partId || ''}`;
        break;
      case 'part_request_created_notification':
      case 'part_request_approved_notification':
        window.location.href = `/part-requests?requestId=${notification.relatedData?.partRequestId || ''}`;
        break;
      default:
        console.log('No specific navigation for:', notification.type);
    }
  };

  // Bulk actions
  const handleSelectNotification = (notificationId) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId);
    } else {
      newSelected.add(notificationId);
    }
    setSelectedNotifications(newSelected);
  };

  const handleSelectAll = () => {
    const filteredNotifs = getFilteredNotifications(currentFilter);
    if (selectedNotifications.size === filteredNotifs.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifs.map(n => n.id)));
    }
  };

  const markSelectedAsRead = async () => {
    const promises = Array.from(selectedNotifications).map(id => markAsRead(id));
    await Promise.all(promises);
    setSelectedNotifications(new Set());
    toast.success(`${selectedNotifications.size} notifications marked as read`);
  };

  // Utility functions
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const filteredNotifications = getFilteredNotifications(currentFilter);
  const unreadCounts = getUnreadCountByType();
  const notificationsByPriority = getNotificationsByPriority();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <FaBell className="mr-3 text-blue-600" />
              Notifications
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage all your notifications in one place
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={() => {
                refreshNotifications();
                loadNotifications();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <FaSyncAlt className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-blue-600">{notifications.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-orange-600">{unreadCounts.total}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Unread</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-red-600">{unreadCounts.urgent}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Urgent</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-600">{unreadCounts.tasks}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Tasks</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-purple-600">{unreadCounts.inventory}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Inventory</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-indigo-600">{unreadCounts.orders}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Orders</div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: unreadCounts.total },
              { key: 'urgent', label: 'Urgent', count: unreadCounts.urgent },
              { key: 'high', label: 'High Priority', count: unreadCounts.high },
              { key: 'tasks', label: 'Tasks', count: unreadCounts.tasks },
              { key: 'inventory', label: 'Inventory', count: unreadCounts.inventory },
              { key: 'orders', label: 'Orders', count: unreadCounts.orders }
            ].map(filterOption => (
              <button
                key={filterOption.key}
                onClick={() => setCurrentFilter(filterOption.key)}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  currentFilter === filterOption.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {filterOption.label}
                {filterOption.count > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-opacity-20 bg-current">
                    {filterOption.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center space-x-2">
            {selectedNotifications.size > 0 && (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedNotifications.size} selected
                </span>
                <button
                  onClick={markSelectedAsRead}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                >
                  <FaCheck className="w-3 h-3" />
                  <span>Mark Read</span>
                </button>
              </>
            )}
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
              >
                <FaCheckDouble className="w-3 h-3" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Table Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={filteredNotifications.length > 0 && selectedNotifications.size === filteredNotifications.length}
              onChange={handleSelectAll}
              className="mr-4"
            />
            <div className="grid grid-cols-12 gap-4 w-full text-sm font-medium text-gray-700 dark:text-gray-300">
              <div className="col-span-1">Type</div>
              <div className="col-span-4">Message</div>
              <div className="col-span-2">Priority</div>
              <div className="col-span-2">Time</div>
              <div className="col-span-2">Triggered By</div>
              <div className="col-span-1">Actions</div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <FaBell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No notifications found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {currentFilter === 'all' ? 'You have no notifications yet.' : `No ${currentFilter} notifications found.`}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.has(notification.id)}
                    onChange={() => handleSelectNotification(notification.id)}
                    className="mr-4"
                  />
                  
                  <div className="grid grid-cols-12 gap-4 w-full items-center">
                    {/* Type & Icon */}
                    <div className="col-span-1 flex items-center">
                      <span className="text-2xl mr-2">{getNotificationIcon(notification.type)}</span>
                    </div>

                    {/* Message */}
                    <div className="col-span-4">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                    </div>

                    {/* Priority */}
                    <div className="col-span-2">
                      <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(notification.priority)}`}>
                        {notification.priority}
                      </span>
                      {!notification.read && (
                        <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
                      )}
                    </div>

                    {/* Time */}
                    <div className="col-span-2 text-sm text-gray-600 dark:text-gray-400">
                      {formatTime(notification.createdAt)}
                    </div>

                    {/* Triggered By */}
                    <div className="col-span-2 text-sm text-gray-600 dark:text-gray-400">
                      {notification.triggeredBy?.userName || notification.triggeredBy?.name || 'System'}
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex space-x-2">
                      <button
                        onClick={() => onNotificationClick(notification)}
                        className="text-blue-600 hover:text-blue-700"
                        title="View"
                      >
                        <FaExternalLinkAlt className="w-4 h-4" />
                      </button>
                      
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-green-600 hover:text-green-700"
                          title="Mark as read"
                        >
                          <FaCheck className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More */}
        {hasMore && filteredNotifications.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <button
              onClick={loadMoreNotifications}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedNotificationPage;
