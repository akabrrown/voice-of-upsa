"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { Bell, BellRing, X } from "lucide-react";
import { toast } from "react-hot-toast";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void | Promise<void>>;
    OneSignal?: any;
  }
}

const DEFAULT_APP_ID = "7f22b994-e03e-4e3f-b141-6ab398cbcdd0";

export default function OneSignalProvider() {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || DEFAULT_APP_ID;
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isPromptDismissed, setIsPromptDismissed] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isRequesting, setIsRequesting] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined" || !appId || appId === "your-onesignal-app-id") {
      return;
    }

    if ((window as any).__onesignal_initialized) {
      return;
    }
    (window as any).__onesignal_initialized = true;

    // Check if browser native notification permission is already granted
    if (typeof Notification !== "undefined") {
      if (Notification.permission === "granted") {
        setIsSubscribed(true);
      }
    }

    try {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function (OneSignal) {
        try {
          await OneSignal.init({
            appId,
            allowLocalhostAsSecureOrigin: true,
            serviceWorkerParam: { scope: "/" },
            serviceWorkerPath: "/OneSignalSDKWorker.js",
          });

          setIsInitialized(true);

          // In OneSignal v16, Notifications.permission is a boolean
          const currentPermission = Boolean(OneSignal.Notifications?.permission);
          if (currentPermission) {
            setIsSubscribed(true);
          }

          // Listen for permission changes
          OneSignal.Notifications?.addEventListener("permissionChange", (permission: boolean) => {
            setIsSubscribed(Boolean(permission));
            if (permission) {
              toast.success("Voice of UPSA alerts enabled!");
            }
          });

          // Attempt prompt with force flag if permission is not yet decided
          if (!currentPermission && typeof Notification !== "undefined" && Notification.permission === "default") {
            setTimeout(() => {
              try {
                OneSignal.Slidedown?.promptPush?.({ force: true })?.catch(() => {});
              } catch {
                // ignore
              }
            }, 1500);
          }
        } catch (err) {
          console.warn("[OneSignal] Init error:", err);
        }
      });
    } catch (e) {
      console.error("[OneSignal] Client setup error:", e);
    }
  }, [appId]);

  const handleRequestPermission = async () => {
    if (typeof window === "undefined") return;

    if (typeof Notification === "undefined") {
      toast.error("Push notifications are not supported on this browser.");
      return;
    }

    if (Notification.permission === "denied") {
      toast.error(
        "Notifications are blocked in your browser settings. Click the lock/settings icon in your address bar to allow them.",
        { duration: 6000 }
      );
      return;
    }

    if (Notification.permission === "granted") {
      setIsSubscribed(true);
      toast.success("Notifications are already enabled!");
      return;
    }

    setIsRequesting(true);

    // Immediate feedback so the user knows the action was received
    toast("Opening notification prompt... Click 'Allow' when asked.", {
      icon: "🔔",
      duration: 4000,
    });

    try {
      // 1. Attempt OneSignal slidedown prompt in case native is restricted
      try {
        if (window.OneSignal?.Slidedown?.promptPush) {
          window.OneSignal.Slidedown.promptPush({ force: true }).catch(() => {});
        }
      } catch {
        // ignore
      }

      // 2. Direct native browser permission request
      const permissionPromise = Notification.requestPermission();
      const timeoutPromise = new Promise<NotificationPermission>((resolve) =>
        setTimeout(() => resolve(Notification.permission), 5000)
      );

      const result = await Promise.race([permissionPromise, timeoutPromise]);

      if (result === "granted") {
        setIsSubscribed(true);
        toast.success("Subscribed to Voice of UPSA alerts!");

        // Sync with OneSignal SDK
        try {
          if (window.OneSignal?.Notifications) {
            window.OneSignal.Notifications.requestPermission().catch(() => {});
          }
        } catch {
          // ignore
        }
      } else if (result === "denied") {
        toast.error("Notification permission was denied.");
      } else {
        toast("If prompt did not show, check the bell or lock icon in your address bar.", {
          duration: 5000,
        });
      }
    } catch (err) {
      console.error("[OneSignal] Permission request error:", err);
      toast.error("Failed to open notification prompt.");
    } finally {
      setIsRequesting(false);
    }
  };

  if (!appId || appId === "your-onesignal-app-id") {
    return null;
  }

  return (
    <>
      <Script
        id="onesignal-sdk"
        src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
        strategy="afterInteractive"
      />

      {/* Floating Permission Trigger to guarantee user-gesture activation for SDK validation */}
      {!isSubscribed && (
        <div className="fixed bottom-5 right-5 z-40">
          {!isPromptDismissed ? (
            <div className="bg-white text-gray-800 rounded-2xl shadow-xl border border-gray-200/90 p-4 max-w-xs animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="h-9 w-9 rounded-xl bg-upsa-navy text-white flex items-center justify-center shrink-0 shadow-sm relative">
                    <BellRing className="h-4 w-4" />
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-upsa-gold opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-upsa-gold"></span>
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-upsa-navy tracking-tight">Campus News Alerts</h4>
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-snug mt-0.5">
                      Get breaking news and official announcements instantly.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPromptDismissed(true)}
                  aria-label="Dismiss alert prompt"
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mr-1 -mt-1 rounded-md"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-3.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  disabled={isRequesting}
                  className="flex-1 bg-upsa-navy hover:bg-upsa-navy/90 text-white text-xs font-semibold py-2 px-3 rounded-xl transition-all shadow-xs hover:shadow flex items-center justify-center space-x-1.5 active:scale-98 disabled:opacity-85"
                >
                  {isRequesting ? (
                    <>
                      <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Requesting...</span>
                    </>
                  ) : (
                    <>
                      <Bell className="h-3.5 w-3.5" />
                      <span>Enable Alerts</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPromptDismissed(true)}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-2 transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleRequestPermission}
              title="Enable Voice of UPSA News Alerts"
              className="group relative flex items-center justify-center h-12 w-12 rounded-full bg-upsa-navy text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 border-2 border-white focus:outline-none focus:ring-2 focus:ring-upsa-gold"
            >
              <Bell className="h-5 w-5 group-hover:animate-swing" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-upsa-gold opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-upsa-gold"></span>
              </span>
            </button>
          )}
        </div>
      )}
    </>
  );
}

