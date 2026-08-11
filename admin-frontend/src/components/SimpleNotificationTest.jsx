import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { toast } from 'react-toastify';

const SimpleNotificationTest = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [status, setStatus] = useState('Disconnected');

  useEffect(() => {
    // Connect to socket server
    const newSocket = io('http://localhost:3000', {
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setIsConnected(true);
      setStatus('Connected');
      toast.success('🔌 Socket connected!');
      
      // Authenticate as admin user
      setTimeout(() => {
        newSocket.emit('user_authenticate', {
          userId: 'test_admin_123',
          userRole: 'admin',
          userName: 'Test Admin',
          department: 'testing'
        });
      }, 500);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
      setStatus('Disconnected');
      toast.error('🔌 Socket disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('🚨 Socket connection error:', error);
      setStatus('Connection Error: ' + error.message);
      toast.error('🚨 Connection failed: ' + error.message);
    });

    newSocket.on('authentication_success', (data) => {
      console.log('🎉 Authentication successful:', data);
      setStatus('Connected & Authenticated');
      toast.success('🎉 Authenticated successfully!');
    });

    // Listen for all notification events
    const notificationEvents = [
      'test_notification',
      'sale_order_created',
      'task_assigned',
      'task_completed',
      'notification'
    ];

    notificationEvents.forEach(eventType => {
      newSocket.on(eventType, (data) => {
        console.log(`📢 Received ${eventType}:`, data);
        
        const notification = {
          id: Date.now() + Math.random(),
          type: eventType,
          title: data.title || 'New Notification',
          message: data.message || 'You have a new notification',
          timestamp: new Date(),
          data: data
        };
        
        setNotifications(prev => [notification, ...prev].slice(0, 10));
        
        // Play sound
        playNotificationSound();
        
        // Show browser notification
        showBrowserNotification(notification);
        
        // Show react-toastify message
        toast.info(`📢 ${notification.title}: ${notification.message}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      });
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const playNotificationSound = () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      console.log('🔊 Sound played!');
    } catch (error) {
      console.log('🔇 Could not play sound:', error);
    }
  };

  const showBrowserNotification = async (notification) => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo.png'
        });
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/logo.png'
          });
        }
      }
    }
  };

  const sendTestNotification = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/socket-test/notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventType: 'test_notification',
          title: 'Frontend Test',
          message: 'This is a test notification from frontend!',
          targetRoles: ['admin'],
          targetUsers: []
        })
      });

      const result = await response.json();
      console.log('Test notification response:', result);
      toast.success('🧪 Test notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      setStatus('Error: ' + error.message);
      toast.error('❌ Failed to send test notification');
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      if (permission === 'granted') {
        toast.success('🔔 Notification permission granted!');
      } else {
        toast.warn('🔔 Notification permission denied');
      }
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h2>🔔 Notification Test - Simple Version</h2>
      
      {/* Status Display */}
      <div style={{ 
        padding: '15px', 
        marginBottom: '20px', 
        border: `2px solid ${isConnected ? '#28a745' : '#dc3545'}`,
        borderRadius: '8px',
        backgroundColor: isConnected ? '#d4edda' : '#f8d7da'
      }}>
        <h3>Connection Status</h3>
        <p><strong>Status:</strong> {status}</p>
        <p><strong>Socket ID:</strong> {socket?.id || 'Not connected'}</p>
        <p><strong>Connected:</strong> {isConnected ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Notification Permission:</strong> {
          typeof Notification !== 'undefined' ? Notification.permission : 'Not supported'
        }</p>
      </div>

      {/* Test Controls */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Test Controls</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={sendTestNotification}
            disabled={!isConnected}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: isConnected ? '#007bff' : '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: isConnected ? 'pointer' : 'not-allowed'
            }}
          >
            🧪 Send Test Notification
          </button>
          
          <button 
            onClick={requestNotificationPermission}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: 'pointer'
            }}
          >
            🔔 Request Permission
          </button>
          
          <button 
            onClick={playNotificationSound}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#ffc107', 
              color: 'black', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: 'pointer'
            }}
          >
            🔊 Test Sound
          </button>
        </div>
      </div>

      {/* Notifications Display */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Recent Notifications ({notifications.length})</h3>
        {notifications.length === 0 ? (
          <p style={{ 
            padding: '20px', 
            textAlign: 'center', 
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '5px'
          }}>
            No notifications yet. Make sure the backend is running and try sending a test notification!
          </p>
        ) : (
          <div style={{ 
            maxHeight: '400px', 
            overflowY: 'auto',
            border: '1px solid #dee2e6',
            borderRadius: '5px'
          }}>
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                style={{ 
                  padding: '15px', 
                  borderBottom: '1px solid #dee2e6',
                  backgroundColor: '#f8f9fa'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '5px'
                }}>
                  <strong style={{ color: '#333' }}>{notification.title}</strong>
                  <small style={{ color: '#666' }}>
                    {notification.timestamp.toLocaleTimeString()}
                  </small>
                </div>
                <p style={{ margin: '5px 0', color: '#555' }}>{notification.message}</p>
                <small style={{ color: '#999' }}>Type: {notification.type}</small>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{ 
        padding: '15px', 
        backgroundColor: '#e3f2fd',
        border: '1px solid #2196f3',
        borderRadius: '5px'
      }}>
        <h3>📋 Instructions</h3>
        <ol>
          <li><strong>Start Backend:</strong> Make sure your backend server is running on port 3000</li>
          <li><strong>Check Connection:</strong> Status should show "Connected & Authenticated"</li>
          <li><strong>Grant Permission:</strong> Click "Request Permission" for browser notifications</li>
          <li><strong>Send Test:</strong> Click "Send Test Notification" to test the system</li>
          <li><strong>Watch for:</strong> Toast message, browser notification, sound, and list update</li>
        </ol>
        
        <h4>🔧 Troubleshooting:</h4>
        <ul>
          <li>If not connected, check if backend server is running</li>
          <li>Check browser console for error messages</li>
          <li>Make sure you're accessing via http://localhost (not file://)</li>
          <li>Try refreshing the page</li>
        </ul>
      </div>
    </div>
  );
};

export default SimpleNotificationTest;
