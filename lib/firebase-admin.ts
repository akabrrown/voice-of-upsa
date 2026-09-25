import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

function formatPrivateKey(key: string | undefined) {
  if (!key) return undefined;
  // Remove surrounding quotes if they exist (Vercel sometimes adds them)
  let formattedKey = key.replace(/^"|"$/g, "");
  // Replace literal \n characters with actual newlines
  formattedKey = formattedKey.replace(/\\n/g, "\n");
  // Fix missing spaces in the PEM header and footer (a common copy-paste error)
  formattedKey = formattedKey.replace(/BEGINPRIVATEKEY/g, "BEGIN PRIVATE KEY");
  formattedKey = formattedKey.replace(/ENDPRIVATEKEY/g, "END PRIVATE KEY");
  return formattedKey;
}

export function getAdminMessaging() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
      }),
    });
  }
  return getMessaging();
}
