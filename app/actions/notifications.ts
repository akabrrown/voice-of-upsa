"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("recipient_id", user.id);

  if (error) {
    console.error("Error marking notification read:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function markAllNotificationsAsRead() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .is("read_at", null);

  if (error) {
    console.error("Error marking all notifications read:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updateNotificationPreference(category: string, muted: boolean) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("notification_preferences")
    .upsert({ 
      profile_id: user.id,
      category,
      muted
    }, {
      onConflict: "profile_id,category"
    });

  if (error) {
    console.error("Error updating notification preference:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/user/notifications");
  return { success: true };
}

export async function sendBroadcastNotification(type: string, category: string, payload: any) {
  const supabase = await createClient();
  
  // 1. Get all profiles
  const { data: profiles } = await supabase.from("profiles").select("id");
  if (!profiles || profiles.length === 0) return { success: false };

  // 2. Get muted preferences for this category
  const { data: mutedPrefs } = await supabase
    .from("notification_preferences")
    .select("profile_id")
    .eq("category", category)
    .eq("muted", true);

  const mutedSet = new Set(mutedPrefs?.map(p => p.profile_id) || []);

  // 3. Filter profiles that haven't muted this category
  const recipients = profiles.filter(p => !mutedSet.has(p.id));

  if (recipients.length === 0) return { success: true };

  // 4. Batch insert notifications
  const notifications = recipients.map(p => ({
    recipient_id: p.id,
    type,
    category,
    payload
  }));

  // Supabase limits inserts to ~1000 rows at a time, we'll assume it's under that for now, 
  // or chunk it if necessary.
  const { error } = await supabase.from("notifications").insert(notifications);

  if (error) {
    console.error("Error broadcasting notification:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
