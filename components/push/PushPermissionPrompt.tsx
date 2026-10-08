"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"; 
import { Bell, AlertCircle, CheckCircle2, Info, Download, Share } from "lucide-react";
import { createClient } from "@/lib/supabase/client"; 

export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type PushState =
  | "checking"
  | "unsupported"
  | "ios-needs-install"
  | "denied"
  | "can-subscribe"
  | "subscribed"
  | "error";

interface Props {
  topics?: string[];
}

export function PushPermissionPrompt({ topics = ["new_articles"] }: Props) {
  const [state, setState] = useState<PushState>("checking");
  const [errorMsg, setErrorMsg] = useState("");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    checkState();

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const checkState = async () => {
    try {
      // Detect iOS Safari not in standalone mode
      const isIos =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;

      if (isIos && !isStandalone) {
        setState("ios-needs-install");
        return;
      }

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setState("unsupported");
        return;
      }

      const permission = Notification.permission;
      if (permission === "denied") {
        setState("denied");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        setState("subscribed");
      } else {
        setState("can-subscribe");
      }
    } catch (e) {
      console.error("Push state check error:", e);
      setState("error");
    }
  };

  const handleSubscribe = async () => {
    try {
      setState("checking");
      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        throw new Error("VAPID public key not found");
      }

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription,
          topics,
          userId: user?.id || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save subscription on server");
      }

      setState("subscribed");
    } catch (e: any) {
      console.error("Subscription error:", e);
      setState("error");
      setErrorMsg(e.message || "Unknown error occurred.");
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      setState("checking");
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Also inform the backend to remove it
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            userId: user?.id || null,
          }),
        });
      }
      setState("can-subscribe");
    } catch (e: any) {
      console.error("Unsubscribe error:", e);
      setState("error");
      setErrorMsg(e.message || "Failed to unsubscribe.");
    }
  };

  if (state === "checking" || state === "subscribed") return null;

  return (
    <div className="p-4 bg-card rounded-xl border shadow-sm max-w-sm w-full space-y-3">
      <div className="flex items-center gap-2 font-medium">
        <Bell className="w-5 h-5 text-[#1F7A6C]" />
        <span>Push Notifications</span>
      </div>

      {state === "unsupported" && (
        <div className="text-sm text-muted-foreground flex gap-2 items-start">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>Your browser does not support web push notifications.</p>
        </div>
      )}

      {state === "ios-needs-install" && (
        <div className="text-sm text-muted-foreground space-y-2">
          <p className="flex gap-2 items-start text-gray-900 font-medium">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
            Install to enable notifications
          </p>
          <ol className="list-decimal pl-6 space-y-2 text-gray-600">
            <li>Tap the <Share className="w-4 h-4 inline mx-1" /> <strong>Share</strong> button at the bottom of Safari.</li>
            <li>Select <strong>Add to Home Screen</strong>.</li>
            <li>Open the app from your Home Screen to turn on notifications.</li>
          </ol>
        </div>
      )}

      {state === "denied" && (
        <div className="text-sm text-muted-foreground flex gap-2 items-start">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>Notifications are blocked. You need to enable them in your browser settings.</p>
        </div>
      )}

      {state === "can-subscribe" && (
        <Button onClick={handleSubscribe} className="w-full bg-[#1F7A6C] hover:bg-[#1F7A6C]/90 text-white">
          Turn on notifications
        </Button>
      )}



      {state === "error" && (
        <div className="text-sm text-muted-foreground flex gap-2 items-start">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>We couldn&apos;t enable notifications at this time.</p>
        </div>
      )}

      {deferredPrompt && state !== "ios-needs-install" && (
        <div className="pt-2 border-t mt-3">
          <Button 
            variant="outline" 
            onClick={handleInstallClick} 
            className="w-full text-xs flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            Install Voice of UPSA App
          </Button>
        </div>
      )}
    </div>
  );
}
