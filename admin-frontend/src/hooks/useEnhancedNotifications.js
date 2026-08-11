import { useState, useEffect } from 'react';
import enhancedNotificationService from '../services/enhancedNotificationService';
import { getAuthHeader } from '../utils/authUtils';

export const useEnhancedNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize enhanced notification service for API-based features and Firebase
    const initializeEnhancedService = async () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('authToken');

      if (token && user.id) {
        await enhancedNotificationService.init();
        enhancedNotificationService.connect(user);
      }

      // Set initial state from enhanced service
      setNotifications(enhancedNotificationService.getNotifications());
      setUnreadCount(enhancedNotificationService.getUnreadCount());
      setIsConnected(enhancedNotificationService.isConnectedToService());
    };

    // Initialize service
    initializeEnhancedService();

    // Setup listeners for enhanced service updates
    const unsubscribeUnreadCount = enhancedNotificationService.addEventListener('unreadCountUpdated', (data) => {
      setUnreadCount(data.count);
    });

    const unsubscribeNotifications = enhancedNotificationService.addEventListener('notificationsUpdated', (notifications) => {
      setNotifications(notifications);
    });

    const unsubscribeConnected = enhancedNotificationService.addEventListener('connected', (data) => {
      setIsConnected(true);
    });

    const unsubscribeDisconnected = enhancedNotificationService.addEventListener('disconnected', () => {
      setIsConnected(false);
    });

    const unsubscribeNotificationRead = enhancedNotificationService.addEventListener('notificationRead', (data) => {
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === data.notificationId 
            ? { ...notif, read: true, readAt: new Date().toISOString() }
            : notif
        )
      );
    });

    const unsubscribeAllRead = enhancedNotificationService.addEventListener('allNotificationsRead', () => {
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true, readAt: new Date().toISOString() }))
      );
    });

    // Cleanup on unmount
    return () => {
      // Cleanup enhanced service listeners
      unsubscribeUnreadCount();
      unsubscribeNotifications();
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribeNotificationRead();
      unsubscribeAllRead();
    };
  }, []);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    return await enhancedNotificationService.markAsRead(notificationId);
  };

  // Mark all as read
  const markAllAsRead = async () => {
    return await enhancedNotificationService.markAllAsRead();
  };

  // Fetch notifications from API
  const fetchNotifications = async (page = 1, limit = 20) => {
    try {
      setLoading(true);
      const token = getAuthHeader();
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Use /all endpoint for admin users, /my-notifications for others
      const endpoint = user.role === 'admin' 
        ? 'all' 
        : 'my-notifications';
      
      const response = await fetch(
        `${import.meta.env.VITE_APIURL}/api/notifications/${endpoint}?page=${page}&limit=${limit}`,
        {
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Fetch notifications response:', response);
      if (response.ok) {
        const data = await response.json();
        
        if (page === 1) {
          setNotifications(data.notifications);
        } else {
          setNotifications(prev => [...prev, ...data.notifications]);
        }
        
        setUnreadCount(data.unreadCount || 0);
        
        return {
          notifications: data.notifications,
          hasMore: data.pagination?.hasMore || false,
          total: data.pagination?.total || 0
        };
      }
      
      return { notifications: [], hasMore: false };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { notifications: [], hasMore: false };
    } finally {
      setLoading(false);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notificationId) => {
    const actionUrl = await enhancedNotificationService.handleNotificationClick(notificationId);
    return actionUrl;
  };

  // Refresh data
  const refreshNotifications = () => {
    enhancedNotificationService.fetchRecentNotifications();
  };

  const refreshUnreadCount = () => {
    enhancedNotificationService.fetchUnreadCount();
  };

  // Filter notifications
  const getFilteredNotifications = (filter = 'all') => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'read':
        return notifications.filter(n => n.read);
      case 'urgent':
        return notifications.filter(n => n.priority === 'urgent');
      case 'high':
        return notifications.filter(n => n.priority === 'high');
      case 'tasks':
        return notifications.filter(n => n.type?.includes('task'));
      case 'inventory':
        return notifications.filter(n => n.type?.includes('inventory') || n.type?.includes('part'));
      case 'orders':
        return notifications.filter(n => n.type?.includes('sale_order'));
      default:
        return notifications;
    }
  };

  // Get notifications by priority
  const getNotificationsByPriority = () => {
    return {
      urgent: notifications.filter(n => n.priority === 'urgent'),
      high: notifications.filter(n => n.priority === 'high'),
      normal: notifications.filter(n => n.priority === 'normal'),
      low: notifications.filter(n => n.priority === 'low')
    };
  };

  // Get unread count by type
  const getUnreadCountByType = () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    return {
      total: unreadCount,
      tasks: unreadNotifications.filter(n => n.type?.includes('task')).length,
      inventory: unreadNotifications.filter(n => n.type?.includes('inventory') || n.type?.includes('part')).length,
      orders: unreadNotifications.filter(n => n.type?.includes('sale_order')).length,
      urgent: unreadNotifications.filter(n => n.priority === 'urgent').length,
      high: unreadNotifications.filter(n => n.priority === 'high').length
    };
  };

  return {
    notifications,
    unreadCount,
    isConnected,
    loading,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
    handleNotificationClick,
    refreshNotifications,
    refreshUnreadCount,
    getFilteredNotifications,
    getNotificationsByPriority,
    getUnreadCountByType
  };
};

export default useEnhancedNotifications;
