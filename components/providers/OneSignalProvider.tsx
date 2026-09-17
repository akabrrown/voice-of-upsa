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
            notifyButton: {
              enable: true,
              size: "medium",
              theme: "default",
              position: "bottom-right",
              offset: {
                bottom: "20px",
                right: "20px",
              },
              showCredit: false,
              text: {
                "tip.state.unsubscribed": "Subscribe to Voice of UPSA updates",
                "tip.state.subscribed": "You are subscribed to Voice of UPSA updates",
                "tip.state.blocked": "Notifications blocked",
                "message.prenotify": "Click to get breaking campus news alerts",
                "message.action.subscribed": "Thanks for subscribing!",
                "message.action.resubscribed": "You are subscribed!",
                "message.action.unsubscribed": "You will no longer receive notifications",
                "dialog.main.title": "Voice of UPSA News Alerts",
                "dialog.main.button.subscribe": "SUBSCRIBE",
                "dialog.main.button.unsubscribe": "UNSUBSCRIBE",
              },
            },
            promptOptions: {
              slidedown: {
                prompts: [
                  {
                    type: "push",
                    autoPrompt: true,
                    text: {
                      actionMessage: "Stay informed with breaking campus updates and official UPSA news announcements.",
                      acceptButton: "Allow",
                      cancelButton: "Later",
                    },
                    delay: {
                      pageViews: 1,
                      timeDelay: 2,
                    },
                  },
                ],
              },
            },
          });

          // If push is supported and permission not yet decided, prompt immediately
          if (OneSignal.Notifications?.isPushSupported?.()) {
            const currentPermission = OneSignal.Notifications.permission;
            if (!currentPermission) {
              OneSignal.Slidedown?.promptPush?.().catch(() => {});
            }
          }
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
