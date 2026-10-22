"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateAdStatus(adId: string, newStatus: "pending" | "approved" | "rejected" | "active" | "completed", adminNotes?: string) {
  const supabase = await createClient();

  // Verify Admin Role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .single();

  const isStaff = ['admin', 'editor', 'developer'].includes((profile as any)?.role) || (profile as any)?.is_admin === true;
  if (!isStaff) {
    return { error: "Forbidden: Staff access required" };
  }

  const updateData: any = { status: newStatus };
  if (adminNotes !== undefined) {
    updateData.admin_notes = adminNotes;
  }

  let { error } = await supabase
    .from("advertisements")
    .update(updateData)
    .eq("id", adId);

  // If admin_notes is not yet in the schema cache, fallback to updating status only
  if (error && (error.message?.includes("admin_notes") || (error as any).code === "PGRST204")) {
    const fallback = await supabase
      .from("advertisements")
      .update({ status: newStatus })
      .eq("id", adId);
    error = fallback.error;
  }

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/admin/ads");
  return { success: true };
}
