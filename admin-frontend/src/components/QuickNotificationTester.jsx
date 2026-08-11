import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const QuickNotificationTester = () => {
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    // Get debug info about authentication
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const authToken = localStorage.getItem('authToken');
    
    setDebugInfo({
      hasToken: !!token,
      hasUser: !!user,
      hasAuthToken: !!authToken,
      tokenLength: token ? token.length : 0,
      userInfo: user ? JSON.parse(user) : null
    });
  }, []);

  const sendTestNotification = async () => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
      console.log('🔑 Auth Debug:', {
        token: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
        tokenLength: token ? token.length : 0,
        user: localStorage.getItem('user'),
        allKeys: Object.keys(localStorage)
      });
      
      if (!token) {
        toast.error('❌ No authentication token found. Please login first.');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/notifications/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        toast.success('✅ Test notification sent! Check your notification bell.');
        console.log('Test notification response:', data);
      } else {
        const errorData = await response.json();
        console.error('❌ Error response:', errorData);
        toast.error(`❌ Failed: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('❌ Error sending test notification');
    }
  };

  // Test sound function
  const testSound = () => {
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
      
      toast.success('🔊 Sound test played!');
      console.log('🔊 Sound played successfully');
    } catch (error) {
      console.error('🔇 Sound error:', error);
      toast.error('🔇 Sound failed: ' + error.message);
    }
  };

  const sendTaskUpdateNotification = async () => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) {
        toast.error('❌ No authentication token found');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/notifications/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Task Status Updated',
          message: 'Task TC-10001 status changed from In Progress to Completed',
          type: 'task_completed',
          targetRoles: ['admin', 'manager', 'reception'],
          priority: 'high',
          requiresAction: false,
          actionUrl: '/tasks/test123'
        })
      });

      if (response.ok) {
        toast.success('✅ Task notification sent!');
      } else {
        const errorData = await response.json();
        toast.error(`❌ Failed: ${errorData.message}`);
      }
    } catch (error) {
      toast.error('❌ Error sending task notification');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      zIndex: 10000,
      background: 'white',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      border: '1px solid #e2e8f0',
      minWidth: '200px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold' }}>
        🧪 Debug & Test
      </h4>
      
      {/* Debug Info */}
      <div style={{ fontSize: '11px', marginBottom: '10px', color: '#666' }}>
        <div>Token: {debugInfo.hasToken ? '✅' : '❌'} ({debugInfo.tokenLength})</div>
        <div>User: {debugInfo.hasUser ? '✅' : '❌'}</div>
        <div>Role: {debugInfo.userInfo?.role || 'N/A'}</div>
      </div>
      
      <div style={{ display: 'flex', gap: '6px', flexDirection: 'column' }}>
        <button
          onClick={testSound}
          style={{
            padding: '6px 10px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          🔊 Test Sound
        </button>
        
        <button
          onClick={sendTestNotification}
          style={{
            padding: '6px 10px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          📢 Send Test
        </button>
        
        <button
          onClick={sendTaskUpdateNotification}
          style={{
            padding: '6px 10px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          ✅ Task Complete
        </button>
        
        <button
          onClick={() => {
            console.log('LocalStorage contents:', Object.keys(localStorage).map(key => ({
              key,
              value: localStorage.getItem(key)?.substring(0, 50) + '...'
            })));
            toast.info('Check console for localStorage contents');
          }}
          style={{
            padding: '6px 10px',
            backgroundColor: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          🔍 Debug Log
        </button>
      </div>
    </div>
  );
};

export default QuickNotificationTester;
