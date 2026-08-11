import { useState, useEffect } from 'react';
import { onMessageListener, requestNotificationPermission } from './firebase';
import notificationSound from './assets/notification.mp3';
import notificationService from './services/notificationService';

function FirebasePopup() {
  const [show, setShow] = useState(false);
  const [notification, setNotification] = useState({ title: '', body: '' });
  const [isTokenFound, setTokenFound] = useState(false);
  const [audio, setAudio] = useState(null);

  useEffect(() => {
    // Preload the audio and store it in state
    const audioInstance = new Audio(notificationSound);
    setAudio(audioInstance);

    // Get user information from localStorage and initialize services
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const userId = user.id || user._id;
    
    console.log('User object from localStorage:', user);
    console.log('User ID for Firebase:', userId);
    console.log('Token found:', token ? 'Yes' : 'No');

    // Initialize notification service
    if (token && userId) {
      notificationService.init();
      notificationService.connect(user);
      console.log('Notification service initialized for user:', userId);
    } else {
      console.warn('Cannot initialize notification service - missing token or user ID');
    }

    // Check notification permission status
    if (userId) {
      if ('Notification' in window && Notification.permission === 'granted') {
        setTokenFound(true);
        console.log('Notification permission already granted for user:', userId);
      } else {
        console.log('Notification permission not granted yet');
      }
    }
  }, []);

  const playNotificationSound = () => {
    if (audio) {
      audio.play().catch((err) => {
        console.error('Audio playback failed:', err);
      });
    }
  };

  onMessageListener()
    .then((payload) => {
      console.log('Firebase message received:', payload);
      
      // Show popup notification
      setShow(true);
      setNotification({
        title: payload.notification?.title || payload.data?.title || 'New Notification',
        body: payload.notification?.body || payload.data?.body || 'You have a new notification',
      });
      
      // Play notification sound
      playNotificationSound();
      
      // Send to notification service for handling
      const notificationData = {
        title: payload.notification?.title || payload.data?.title || 'New Notification',
        message: payload.notification?.body || payload.data?.body || 'You have a new notification',
        notificationId: payload.data?.notificationId || Date.now(),
        type: payload.data?.type || 'general',
        priority: payload.data?.priority || 'normal',
        triggeredBy: payload.data?.triggeredBy ? JSON.parse(payload.data.triggeredBy) : null,
        relatedData: payload.data?.relatedData ? JSON.parse(payload.data.relatedData) : {},
        requiresAction: payload.data?.requiresAction === 'true',
        actionUrl: payload.data?.actionUrl || ''
      };
      
      // Handle the notification through the service
      notificationService.handleNotification(notificationData.type, notificationData);
      
      console.log('Firebase notification processed:', notificationData);
    })
    .catch((err) => console.log('Firebase message listener error: ', err));

  return (
    <>
      {/* <div
        className={`absolute top-5 right-5 w-[300px] bg-white  border border-gray-200 rounded-lg shadow-lg transition-transform transform ${
          show ? 'translate-y-0 opacity-100' : '-translate-y-5 opacity-0'
        }`}
        style={{ zIndex: 1000, display: show ? 'block' : 'none' }}
      > */}
        {/* <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-white rounded-t-lg">
          <strong className="text-sm font-medium">{notification.title}</strong>
          <small className="text-xs">just now</small>
          <button
            onClick={() => setShow(false)}
            className="text-gray-400 hover:text-white focus:outline-none"
          >
            ✕
          </button>
        </div>
        <div className="px-4 py-3 text-gray-700 text-sm">{notification.body}</div>
      </div> */}
      {/* <header className="App-header"> */}
        {/* {!isTokenFound && <h1> Need notification permission ❗️ </h1>} */}
        {/* <button
          onClick={() => {
            setShow(true);
            playNotificationSound(); // Ensure user interaction triggers sound
          }}
        >
          Show Toast
        </button> */}
      {/* </header> */}
    </>
  );
}

export default FirebasePopup;
