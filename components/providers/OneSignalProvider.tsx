"use client";

import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void | Promise<void>>;
    OneSignal?: any;
  }
}

const DEFAULT_APP_ID = "7f22b994-e03e-4e3f-b141-6ab398cbcdd0";

export default function OneSignalProvider() {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || DEFAULT_APP_ID;

  useEffect(() => {
    if (typeof window === "undefined" || !appId || appId === "your-onesignal-app-id") {
      return;
    }

    try {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function (OneSignal) {
        try {
          await OneSignal.init({
            appId,
            allowLocalhostAsSecureOrigin: true,
          });
        } catch (err) {
          console.warn("[OneSignal] Init error:", err);
        }
      });
    } catch (e) {
      console.error("[OneSignal] Client setup error:", e);
    }
  }, [appId]);

  if (!appId || appId === "your-onesignal-app-id") {
    return null;
  }

  return (
    <Script
      id="onesignal-sdk"
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="afterInteractive"
    />
  );
}
