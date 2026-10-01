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
