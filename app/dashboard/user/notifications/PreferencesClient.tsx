"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { updateNotificationPreference } from "@/app/actions/notifications";
import { toast } from "react-hot-toast";
import { Bell, Briefcase, Camera, MessageSquare, Store } from "lucide-react";

type Preference = {
  category: string;
  muted: boolean;
};

export function PreferencesClient({ initialPreferences }: { initialPreferences: Preference[] }) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const categories = [
    { id: "campus_mart", title: "Campus Mart", icon: Store, description: "Updates about your orders, products, and buyer inquiries." },
    { id: "job_board", title: "Job Board", icon: Briefcase, description: "Notifications for your job postings and applications." },
    { id: "gallery", title: "Campus Gallery", icon: Camera, description: "Alerts for photo approvals, rejections, and comments." },
    { id: "confessions", title: "Confessions", icon: MessageSquare, description: "Updates on your anonymous posts." },
  ];

  const handleToggle = async (categoryId: string, currentMuted: boolean) => {
    setIsUpdating(categoryId);
    const newMuted = !currentMuted;
    
    // Optimistic update
    setPreferences(prev => {
      const exists = prev.find(p => p.category === categoryId);
      if (exists) {
        return prev.map(p => p.category === categoryId ? { ...p, muted: newMuted } : p);
      } else {
        return [...prev, { category: categoryId, muted: newMuted }];
      }
    });

    const result = await updateNotificationPreference(categoryId, newMuted);
    
    if (!result.success) {
      toast.error(result.error || "Failed to update preference.");
      // Revert on failure
      setPreferences(prev => {
        const exists = prev.find(p => p.category === categoryId);
        if (exists) {
          return prev.map(p => p.category === categoryId ? { ...p, muted: currentMuted } : p);
        } else {
          return [...prev, { category: categoryId, muted: currentMuted }];
        }
      });
    } else {
      toast.success(`Notifications ${newMuted ? "muted" : "unmuted"} for ${categories.find(c => c.id === categoryId)?.title}`);
    }
    
    setIsUpdating(null);
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="p-2 bg-[#1B2A4A]/5 rounded-lg text-[#1B2A4A]">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#1B2A4A]">Notification Preferences</h2>
          <p className="text-sm text-gray-500">Choose which categories you want to receive alerts for.</p>
        </div>
      </div>

      <div className="space-y-6 pt-2">
        {categories.map((category) => {
          const pref = preferences.find(p => p.category === category.id);
          const isMuted = pref ? pref.muted : false;
          const Icon = category.icon;

          return (
            <div key={category.id} className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-50 rounded-lg text-gray-500 shrink-0 mt-0.5">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <Label htmlFor={`toggle-${category.id}`} className="text-sm font-medium text-gray-900 cursor-pointer">
                    {category.title}
                  </Label>
                  <p className="text-xs text-gray-500 mt-0.5 max-w-sm">
                    {category.description}
                  </p>
                </div>
              </div>
              <div className="shrink-0 mt-1">
                <Switch
                  id={`toggle-${category.id}`}
                  checked={!isMuted}
                  disabled={isUpdating === category.id}
                  onCheckedChange={() => handleToggle(category.id, isMuted)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
