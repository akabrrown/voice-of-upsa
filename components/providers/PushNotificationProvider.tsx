"use client";

import { useState } from "react";
import { PushPermissionPrompt } from "@/components/push/PushPermissionPrompt";
import { X } from "lucide-react";

export default function PushNotificationProvider() {
  const [isDismissed, setIsDismissed] = useState(false);
  const [shouldHide, setShouldHide] = useState(true); // Start hidden until checking is done

  if (isDismissed || shouldHide) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="relative">
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute -top-2 -right-2 bg-white dark:bg-[#0C1729] text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white rounded-full p-1 shadow-md border border-gray-200 dark:border-white/10 z-10"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
        <PushPermissionPrompt 
          topics={["new_articles"]} 
          onStateChange={(state) => {
            setShouldHide(state === "checking" || state === "subscribed");
          }}
        />
      </div>
    </div>
  );
}
