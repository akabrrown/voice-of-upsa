"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, X } from "lucide-react";
import { toast } from "react-hot-toast";
import OneSignal from 'react-onesignal';

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

    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      setIsInitialized(true);
      return;
    }

    async function initOneSignal() {
      try {
        if (!(OneSignal as any).initialized) {
          await OneSignal.init({
            appId,
            allowLocalhostAsSecureOrigin: true,
          });
        }


        const isOptedIn = Boolean(OneSignal.User?.PushSubscription?.optedIn);
        
        if (isOptedIn) {
          setIsSubscribed(true);
        } else if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          // If browser already granted permission, attempt opt in
          OneSignal.User?.PushSubscription?.optIn?.().catch(() => {});
        }

        OneSignal.User?.PushSubscription?.addEventListener("change", (event: any) => {
          if (event?.current?.optedIn) {
            setIsSubscribed(true);
            toast.success("Subscribed to Voice of UPSA alerts! SDK verified.");
          }
        });

      } catch (e: any) {
        console.error("[OneSignal] Init error:", e);
        if (e?.message?.includes("Can only be used on")) {
          console.warn("OneSignal is restricted to production domain. Local testing is disabled in the OneSignal dashboard.");
        }
      } finally {
        setIsInitialized(true);
      }
    }

    initOneSignal();
  }, [appId]);

  const handleRequestPermission = async () => {
    if (typeof window === "undefined" || !isInitialized) return;

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

    setIsRequesting(true);

    if (!(OneSignal as any).initialized) {
      toast.error(
        window.location.hostname === "localhost" 
          ? "OneSignal is disabled on localhost. Test in production or update OneSignal settings." 
          : "OneSignal failed to initialize. Please ensure you are on the main domain (voiceofupsa.com) and disable any ad-blockers."
      );
      setIsRequesting(false);
      return;
    }

    toast("Opening notification prompt... Click 'Allow' when asked.", {
      icon: "🔔",
      duration: 4000,
    });

    try {
      // 1. Primary: Trigger in-page slidedown
      if (OneSignal.Slidedown?.promptPush) {
        await OneSignal.Slidedown.promptPush({ force: true });
      } else {
        // Fallback: Direct native browser permission request opt in
        if (OneSignal.User?.PushSubscription?.optIn) {
          await OneSignal.User.PushSubscription.optIn();
        }
      }
      
      const optedIn = Boolean(OneSignal.User?.PushSubscription?.optedIn);
      if (optedIn) {
        setIsSubscribed(true);
      }
    } catch (err: any) {
      console.error("[OneSignal] Opt-in error:", err);
      toast.error(err?.message || "Failed to subscribe. Please try again.");
    } finally {
      setIsRequesting(false);
    }
  };

  if (!appId || appId === "your-onesignal-app-id") {
    return null;
  }

  return (
    <>
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
                  disabled={isRequesting || !isInitialized}
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
                      <span>{isInitialized ? 'Enable Alerts' : 'Loading...'}</span>
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
              disabled={isRequesting || !isInitialized}
              title="Enable Voice of UPSA News Alerts"
              className="group relative flex items-center justify-center h-12 w-12 rounded-full bg-upsa-navy text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 border-2 border-white focus:outline-none focus:ring-2 focus:ring-upsa-gold disabled:opacity-80"
            >
              {isRequesting ? (
                <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <Bell className="h-5 w-5 group-hover:animate-swing" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-upsa-gold opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-upsa-gold"></span>
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </>
  );
}
