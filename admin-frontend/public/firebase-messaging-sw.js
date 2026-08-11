/* eslint-disable no-undef */
// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.12.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyA7PBEE_aWKsuM2bV1CpO_L-_sLjiKN7pQ",
  authDomain: "project-react-notifications.firebaseapp.com",
  projectId: "project-react-notifications",
  storageBucket: "project-react-notifications.appspot.com",
  messagingSenderId: "420526685825",
  appId: "1:420526685825:web:a7e140c9d92e82464d5780",
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Optional: Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Sushant Computerized Mobile Repaire Center Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: payload.data?.notificationId || 'default',
    data: payload.data || {},
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icon-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icon-dismiss.png'
      }
    ],
    requireInteraction: payload.data?.priority === 'urgent',
    timestamp: Date.now()
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Handle the click action
  let clickAction = Promise.resolve();
  
  if (event.action === 'view' || !event.action) {
    const notificationData = event.notification.data;
    let targetUrl = '/';

    // Determine target URL based on notification type
    if (notificationData.actionUrl) {
      targetUrl = notificationData.actionUrl;
    } else if (notificationData.type) {
      switch (notificationData.type) {
        case 'task_assigned_notification':
        case 'task_status_notification':
          targetUrl = '/tasks';
          break;
        case 'sale_order_status_notification':
          targetUrl = '/sale-orders';
          break;
        case 'inventory_approved_notification':
        case 'inventory_request_notification':
        case 'low_stock_alert':
        case 'inventory_update_notification':
          targetUrl = '/inventory';
          break;
        case 'part_request_created_notification':
        case 'part_request_approved_notification':
          targetUrl = '/part-requests';
          break;
        default:
          targetUrl = '/notifications';
      }
    }

    clickAction = clients.openWindow(targetUrl);
  }

  event.waitUntil(clickAction);
});

// Handle notification close events
self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] Notification closed:', event);
  
  // Track notification dismissal if needed
  const notificationData = event.notification.data;
  if (notificationData.notificationId) {
    console.log('Notification dismissed:', notificationData.notificationId);
  }
});