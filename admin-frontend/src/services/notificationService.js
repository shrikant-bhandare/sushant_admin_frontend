import { toast } from 'react-toastify';

class NotificationService {
  constructor() {
    this.listeners = new Map();
    this.isConnected = false;
    this.unreadCount = 0;
    this.notifications = [];
  }

  // Initialize service (Firebase-only mode)
  init(apiUrl = 'http://localhost:3000') {
    try {
      console.log('🔔 Notification service initialized (Firebase mode)');
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Error initializing notification service:', error);
      return null;
    }
  }

  // Connect to service (Firebase-only mode)
  connect(user) {
    console.log('🔔 Notification service connected (Firebase mode)');
    this.isConnected = true;
    this.emitToListeners('connected', { connected: true });
  }

  // Disconnect from service
  disconnect() {
    this.isConnected = false;
    this.emitToListeners('connected', { connected: false });
  }

  // Handle incoming notifications (called by Firebase message handler)
  handleNotification(eventType, data) {
    console.log(`🔔 Received notification [${eventType}]:`, data);

    const notification = {
      id: data.notificationId || Date.now() + Math.random(),
      type: eventType,
      title: data.title || 'New Notification',
      message: data.message || 'You have a new notification',
      priority: data.priority || 'normal',
      requiresAction: data.requiresAction || false,
      actionUrl: data.actionUrl || '',
      triggeredBy: data.triggeredBy || null,
      relatedData: data.relatedData || {},
      createdAt: new Date().toISOString(),
      read: false
    };

    // Add to local notifications array
    this.notifications.unshift(notification);
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50); // Keep only latest 50
    }

    // Update unread count
    this.unreadCount += 1;

    // Show toast notification
    this.showToastNotification(notification);

    // Play sound
    this.playNotificationSound();

    // Show browser notification
    this.showBrowserNotification(notification);

    // Emit to listeners
    this.emitToListeners('notification', notification);
    this.emitToListeners('unreadCount', { count: this.unreadCount });
  }

  // Show toast notification
  showToastNotification(notification) {
    const toastOptions = {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    };

    // Create simple text content for toast
    const title = notification.title;
    const message = notification.message;
    const triggerInfo = notification.triggeredBy 
      ? ` (by ${notification.triggeredBy.userName})` 
      : '';
    
    const content = `${title}: ${message}${triggerInfo}`;

    switch (notification.priority) {
      case 'urgent':
        toast.error(content, toastOptions);
        break;
      case 'high':
        toast.warn(content, toastOptions);
        break;
      default:
        toast.info(content, toastOptions);
        break;
    }
  }

  // Play notification sound
  playNotificationSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('🔇 Could not play notification sound:', error);
    }
  }

  // Show browser notification
  async showBrowserNotification(notification) {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo.png',
          tag: notification.id,
          badge: '/logo.png'
        });
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/logo.png',
            tag: notification.id,
            badge: '/logo.png'
          });
        }
      }
    }
  }

  // Fetch unread count from API
  async fetchUnreadCount() {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.unreadCount = data.unreadCount || 0;
        this.emitToListeners('unreadCount', { count: this.unreadCount });
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }

  // Update unread count
  updateUnreadCount(newCount) {
    this.unreadCount = Math.max(0, newCount);
    this.emitToListeners('unreadCount', { count: this.unreadCount });
  }

  // Get current unread count
  getUnreadCount() {
    return this.unreadCount;
  }

  // Get local notifications
  getLocalNotifications() {
    return this.notifications;
  }

  // Add event listener
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
      }
    };
  }

  // Remove event listener
  removeEventListener(event, callback) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  // Emit to listeners
  emitToListeners(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in notification listener for ${event}:`, error);
        }
      });
    }
  }

  // Check if connected
  isSocketConnected() {
    return this.isConnected;
  }

  // Fetch unread count from API
  async fetchUnreadCount() {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return 0;

      const apiUrl = import.meta.env.VITE_APIURL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.unreadCount = data.count || 0;
        this.emitToListeners('unreadCount', { count: this.unreadCount });
        return this.unreadCount;
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
    return 0;
  }

  // Get current state
  getNotifications() {
    return this.notifications;
  }

  getUnreadCount() {
    return this.unreadCount;
  }

  getIsConnected() {
    return this.isConnected;
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
