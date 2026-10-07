"use client";

import { useState } from "react";
import { PushPermissionPrompt } from "@/components/push/PushPermissionPrompt";
import { X } from "lucide-react";

export default function PushNotificationProvider() {
  const [isDismissed, setIsDismissed] = useState(false);

  // We rely on the internal state of PushPermissionPrompt to hide itself when subscribed
  // But we can also add a local dismiss for the public site
  if (isDismissed) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="relative">
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute -top-2 -right-2 bg-white text-gray-500 hover:text-gray-800 rounded-full p-1 shadow-md border z-10"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
        <PushPermissionPrompt topics={["new_articles"]} />
      </div>
    </div>
  );
}
