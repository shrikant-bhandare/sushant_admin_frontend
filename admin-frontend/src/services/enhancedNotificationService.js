import { toast } from 'react-toastify';

class EnhancedNotificationService {
  constructor() {
    this.isConnected = false;
    this.listeners = new Map();
    this.notifications = [];
    this.unreadCount = 0;
    this.user = null;
    this.firebaseInitialized = false;
  }

  // Initialize the service with Firebase support
  async init(apiUrl = import.meta.env.VITE_APIURL) {
    try {
      await this.initializeFirebase();
      console.log('🔔 Enhanced Notification Service initialized (Firebase only)');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Notification Service:', error);
      return false;
    }
  }

  async initializeFirebase() {
    try {
      // Firebase Web Push implementation would go here
      // For now, we'll simulate initialization
      console.log('📱 Firebase notification service initialized');
      this.firebaseInitialized = true;
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      this.firebaseInitialized = false;
    }
  }

  // Event listener management
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  removeEventListener(event, callback) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Connect user (simplified for API-only mode)
  connect(user) {
    if (!user || !user.id) {
      console.warn('Cannot connect: Invalid user data');
      return;
    }

    this.user = user;
    this.isConnected = true;
    
    console.log('🔔 User connected to notification service:', user.name);
    this.emit('connected', { user });
    
    // Fetch initial notifications
    this.fetchNotifications();
    this.fetchUnreadCount();
  }

  // Disconnect user
  disconnect() {
    this.isConnected = false;
    this.user = null;
    console.log('🔔 User disconnected from notification service');
    this.emit('disconnected');
  }

  // API-based notification fetching
  async fetchNotifications() {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/notifications/my-notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔔 Notifications fetched:', data.notifications);
        this.notifications = data.notifications || [];
        this.emit('notificationsUpdated', this.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }

  async fetchUnreadCount() {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.unreadCount = data.count || 0;
        this.emit('unreadCountUpdated', { count: this.unreadCount });
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Update local state
        this.notifications = this.notifications.map(notif => 
          notif._id === notificationId 
            ? { ...notif, readAt: new Date().toISOString() }
            : notif
        );
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        
        this.emit('notificationRead', { notificationId });
        this.emit('unreadCountUpdated', { count: this.unreadCount });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Update local state
        this.notifications = this.notifications.map(notif => 
          ({ ...notif, readAt: notif.readAt || new Date().toISOString() })
        );
        this.unreadCount = 0;
        
        this.emit('allNotificationsRead');
        this.emit('unreadCountUpdated', { count: 0 });
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Utility methods
  getNotifications() {
    return this.notifications;
  }

  getUnreadCount() {
    return this.unreadCount;
  }

  isConnectedToService() {
    return this.isConnected;
  }

  getCurrentUser() {
    return this.user;
  }

  // Refresh notifications
  refresh() {
    this.fetchNotifications();
    this.fetchUnreadCount();
  }

  // Send test notification (for testing purposes)
  async sendTestNotification() {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) {
        toast.error('❌ No authentication token found');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/notifications/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('✅ Test notification sent!');
        this.refresh(); // Refresh to get the new notification
      } else {
        toast.error('❌ Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('❌ Error sending test notification');
    }
  }
}

// Create and export singleton instance
const enhancedNotificationService = new EnhancedNotificationService();
export default enhancedNotificationService;
