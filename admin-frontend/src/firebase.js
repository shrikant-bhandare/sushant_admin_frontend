import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyA7PBEE_aWKsuM2bV1CpO_L-_sLjiKN7pQ",
  authDomain: "project-react-notifications.firebaseapp.com",
  projectId: "project-react-notifications",
  storageBucket: "project-react-notifications.firebasestorage.app",
  messagingSenderId: "420526685825",
  appId: "1:420526685825:web:a7e140c9d92e82464d5780",
  measurementId: "G-452JH8DTQT",
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestNotificationPermission = async (userId) => {
  try {
    console.log("🔔 requestNotificationPermission called with userId:", userId);
    console.log("🔔 typeof userId:", typeof userId);
    console.log("🔔 API URL:", import.meta.env.VITE_APIURL);

    // Register the service worker
    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;
    console.log("🔔 Service worker registered successfully");

    // Get token
    const token = await getToken(messaging, {
      vapidKey:
        "BOKtyv8AqNYeKGsO6L2OaZTFu5OHqjYQkX5tWqvowQcBmi8Af7qJaM5KZcqwyuZjzcT2BGTeQlD79E1jbsPbV5Q",
      serviceWorkerRegistration: swReg,
    });

    if (token) {
      console.log("🔔 Firebase token obtained:", token.substring(0, 20) + "...");

      // Send token to backend
      if (userId) {
        console.log("🔔 Making API request to:", `${import.meta.env.VITE_APIURL}/api/user/device-token/${userId}`);
        console.log("🔔 Payload:", { deviceToken: token });
        
        const response = await fetch(`${import.meta.env.VITE_APIURL}/api/user/device-token/${userId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify({ deviceToken: token }),
        });
        
        console.log("🔔 API Response status:", response.status);
        const responseData = await response.json();
        console.log("🔔 API Response data:", responseData);
        
        if (response.ok) {
          console.log("✅ Device token registered successfully");
        } else {
          console.error("❌ Device token registration failed:", responseData);
        }
      }

      return token;
    } else {
      console.log("❌ No registration token available. Request permission to generate one.");
    }
  } catch (error) {
    console.error("❌ An error occurred while retrieving token:", error);
  }
};

export const onMessageListener = () =>
  new Promise((resolve, reject) => {
    onMessage(
      messaging,
      (payload) => resolve(payload),
      (err) => reject(err)
    );
  });
