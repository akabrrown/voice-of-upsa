import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Cloud Messaging and get a reference to the service
// Note: messaging() is only supported in browser contexts and on HTTPS
const messaging = async () => {
  const supported = await isSupported();
  if (typeof window !== "undefined" && supported) {
    return getMessaging(app);
  }
  return null;
};

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const msg = await messaging();
      if (!msg) return null;
      
      // Explicitly register the service worker so it doesn't hang if there's an error
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .catch(err => {
          console.error("Service Worker registration failed:", err);
          throw err;
        });

      await navigator.serviceWorker.ready;

      const token = await getToken(msg, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });
      
      return token;
    }
    return null;
  } catch (error: any) {
    console.error("Error requesting notification permission:", error);
    // Instead of failing silently and saying "declined", we surface the real error
    // so it shows up in the UI (e.g., if API keys are missing on Vercel)
    throw error;
  }
};

export const onMessageListener = async () => {
  const msg = await messaging();
  if (!msg) return;

  return new Promise((resolve) => {
    onMessage(msg, (payload) => {
      resolve(payload);
    });
  });
};

export { app, messaging };
