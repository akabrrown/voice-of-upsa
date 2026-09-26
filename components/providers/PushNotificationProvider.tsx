"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { requestNotificationPermission } from "@/lib/firebase";

export default function PushNotificationProvider() {
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isPromptDismissed, setIsPromptDismissed] = useState<boolean>(false);
  const [isRequesting, setIsRequesting] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Check if user is already granted or subscribed in browser
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      const hasSynced = localStorage.getItem("vou_push_synced");
      if (hasSynced === "true") {
        setIsSubscribed(true);
      } else {
        // Permission was granted previously, but backend sync failed (e.g. during missing API keys error).
        // Try to silently sync it now.
        const silentSync = async () => {
          try {
            const { requestNotificationPermission } = await import("@/lib/firebase");
            const token = await requestNotificationPermission();
            if (token) {
              const res = await fetch("/api/notifications/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
              });
              if (res.ok) {
                localStorage.setItem("vou_push_synced", "true");
                setIsSubscribed(true);
              }
            }
          } catch (e) {
            console.error("Silent push sync failed:", e);
          }
        };
        silentSync();
      }
    }
  }, []);

  const handleRequestPermission = async () => {
    if (typeof window === "undefined") return;

    if (typeof Notification === "undefined") {
      toast.error("Push notifications are not supported on this browser.");
      return;
    }

    if (Notification.permission === "denied") {
      toast.error(
        "Notifications are blocked in your browser settings. Click the lock icon in your address bar to allow them.",
        { duration: 6000 }
      );
      return;
    }

    setIsRequesting(true);
    toast("Opening notification prompt... Click 'Allow' when asked.", {
      icon: "🔔",
      duration: 4000,
    });

    try {
      const token = await requestNotificationPermission();
      
      if (token) {
        // Send token to our backend to subscribe to the "all_users" broadcast topic
        const res = await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (res.ok) {
          localStorage.setItem("vou_push_synced", "true");
          setIsSubscribed(true);
          toast.success("Subscribed to Voice of UPSA alerts!");
        } else {
          throw new Error("Failed to register on server");
        }
      } else {
        toast.error("Notifications were declined.");
      }
    } catch (err: any) {
      console.error("[Firebase Push] Subscription failed:", err);
      
      // If the error is a configuration issue (e.g. missing API keys on Vercel)
      if (err?.message?.includes("Missing App configuration") || err?.message?.includes("apiKey")) {
        toast.error("Configuration Error: Missing Firebase API Keys. Please add them to Vercel and redeploy.", { duration: 6000 });
      } else {
        toast.error("Could not enable notifications. Please check browser settings.");
      }
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <>
      {/* Floating Permission Trigger */}
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
              disabled={isRequesting}
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
