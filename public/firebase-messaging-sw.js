// Scripts for firebase and firebase messaging
importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js");

// Set up Firebase in the service worker
const firebaseConfig = {
  // We can use self.registration to fetch these from a simple api or hardcode them here.
  // Using query params or injecting via build step is cleaner, but for VOU Rework, 
  // since the sender ID doesn't contain secrets, hardcoding it is standard for FCM SW.
  apiKey: "AIzaSyBQiB6MMvElW_OffOpU5kljZBMd0rx_PE0",
  authDomain: "voice-of-upsa.firebaseapp.com",
  projectId: "voice-of-upsa",
  storageBucket: "voice-of-upsa.firebasestorage.app",
  messagingSenderId: "394227040865",
  appId: "1:394227040865:web:b237d4691960af9ce4a020"
};

// Initialize the Firebase app in the service worker
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);
  
  const notificationTitle = payload.notification.title || "Voice of UPSA";
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.image || "/icon.png",
    data: payload.data, // Contains the URL to open
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Extract the URL from the notification data, or default to the homepage
  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
