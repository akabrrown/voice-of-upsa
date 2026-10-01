"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateMessageStatus(messageId: string, newStatus: "unread" | "read" | "replied" | "archived", adminNotes?: string) {
  const supabase = await createClient();

  // Verify Admin Role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Forbidden: Admin access required" };
  }

  const updateData: any = { status: newStatus };
  if (adminNotes !== undefined) {
    updateData.admin_notes = adminNotes;
  }

  const { error } = await supabase
    .from("contact_messages")
    .update(updateData)
    .eq("id", messageId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/admin/inbox");
  return { success: true };
}
