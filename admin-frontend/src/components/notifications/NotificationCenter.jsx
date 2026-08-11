import React, { useState } from 'react';
import { useSocket } from '../../customHooks/useSocket';
import './NotificationCenter.css';

const NotificationCenter = ({ userData }) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    removeNotification
  } = useSocket(userData);

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, read

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const formatTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'high') {
      return '🔴';
    }
    return '🔵';
  };

  const getNotificationIcon = (type) => {
    const icons = {
      sale_order_created: '📝',
      task_assigned: '👤',
      task_completed: '✅',
      inventory_low_stock: '📦',
      diagnostic_completed: '🔍',
      part_request_created: '🔧',
      system_alert: '⚠️'
    };
    return icons[type] || '📢';
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    // Here you can add navigation logic based on notification type
    handleNotificationNavigation(notification);
  };

  const handleNotificationNavigation = (notification) => {
    // Add navigation logic based on notification type
    switch (notification.type) {
      case 'sale_order_created':
      case 'sale_order_status_changed':
        // Navigate to sale orders page
        window.location.href = '/sale-orders';
        break;
      case 'task_assigned':
      case 'task_completed':
        // Navigate to tasks page
        window.location.href = '/tasks';
        break;
      case 'inventory_low_stock':
      case 'part_request_created':
        // Navigate to inventory page
        window.location.href = '/inventory';
        break;
      case 'diagnostic_completed':
        // Navigate to diagnostics page
        window.location.href = '/diagnostics';
        break;
      default:
        console.log('No navigation defined for:', notification.type);
    }
  };

  return (
    <div className="notification-center">
      {/* Notification Bell */}
      <button
        className={`notification-bell ${unreadCount > 0 ? 'has-notifications' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            <div className="notification-actions">
              <button 
                onClick={markAllAsRead}
                className="btn-mark-all-read"
                disabled={unreadCount === 0}
              >
                Mark all read
              </button>
              <button 
                onClick={clearNotifications}
                className="btn-clear-all"
                disabled={notifications.length === 0}
              >
                Clear all
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="notification-filters">
            <button 
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </button>
            <button 
              className={filter === 'unread' ? 'active' : ''}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
            <button 
              className={filter === 'read' ? 'active' : ''}
              onClick={() => setFilter('read')}
            >
              Read ({notifications.length - unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="notifications-list">
            {filteredNotifications.length === 0 ? (
              <div className="no-notifications">
                <span className="empty-icon">📭</span>
                <p>No notifications</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''} priority-${notification.priority}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-content">
                    <div className="notification-top">
                      <div className="notification-icon">
                        {getNotificationIcon(notification.type)}
                        {notification.priority === 'high' && (
                          <span className="priority-indicator">{getPriorityIcon(notification.priority)}</span>
                        )}
                      </div>
                      <div className="notification-text">
                        <h4 className="notification-title">{notification.title}</h4>
                        <p className="notification-message">{notification.message}</p>
                      </div>
                      <button
                        className="remove-notification"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        title="Remove notification"
                      >
                        ×
                      </button>
                    </div>
                    <div className="notification-bottom">
                      <span className="notification-time">
                        {formatTime(notification.timestamp)}
                      </span>
                      {!notification.read && (
                        <span className="unread-indicator">●</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Connection Status */}
          <div className="notification-footer">
            <div className="connection-status">
              <span className={`status-indicator ${userData ? 'connected' : 'disconnected'}`}>
                ●
              </span>
              <span className="status-text">
                {userData ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
