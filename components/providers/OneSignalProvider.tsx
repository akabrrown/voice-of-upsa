"use client";

import Script from "next/script";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void | Promise<void>>;
    OneSignal?: any;
  }
}

export default function OneSignalProvider() {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

  if (!appId || appId === "your-onesignal-app-id") {
    return null;
  }

  return (
    <Script
      id="onesignal-sdk"
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="lazyOnload"
      onLoad={() => {
        try {
          window.OneSignalDeferred = window.OneSignalDeferred || [];
          window.OneSignalDeferred.push(async function (OneSignal) {
            await OneSignal.init({
              appId: appId,
              allowLocalhostAsSecureOrigin: true,
              serviceWorkerParam: { scope: "/" },
              serviceWorkerPath: "/OneSignalSDKWorker.js",
            });
          });
        } catch (e) {
          console.error("[OneSignal] Client initialization error:", e);
        }
      }}
    />
  );
}
