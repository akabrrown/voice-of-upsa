const { initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
require('dotenv').config({ path: '.env.local' });

function formatPrivateKey(key) {
  if (!key) return undefined;
  let formattedKey = key.replace(/^"|"$/g, "");
  formattedKey = formattedKey.replace(/\\n/g, "\n");
  formattedKey = formattedKey.replace(/BEGINPRIVATEKEY/g, "BEGIN PRIVATE KEY");
  formattedKey = formattedKey.replace(/ENDPRIVATEKEY/g, "END PRIVATE KEY");
  return formattedKey;
}

try {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    }),
  });
} catch (e) {
  // Ignore if already initialized
}

async function sendTestPush() {
  const message = {
    notification: {
      title: "Test Push from Script",
      body: "If you see this, push notifications are working!",
      imageUrl: "https://voiceofupsa.com/icon-512.png", 
    },
    data: {
      url: "https://voiceofupsa.com",
    },
    topic: "all_users",
  };

  try {
    const response = await getMessaging().send(message);
    console.log("Successfully sent message:", response);
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

sendTestPush();
