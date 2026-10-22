"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type AdStatus = "pending" | "approved" | "rejected" | "active" | "completed" | "expired";

export interface AdConfigurationInput {
  status?: AdStatus;
  ad_placement?: "leaderboard" | "sidebar" | "in-feed" | string;
  ad_type?: "leaderboard" | "sidebar" | "in-feed" | string;
  ad_tier?: "basic" | "standard" | "premium" | string;
  package_tier?: "basic" | "standard" | "premium" | string;
  target_url?: string | null;
  start_date?: string | null;
  starts_at?: string | null;
  end_date?: string | null;
  ends_at?: string | null;
  admin_notes?: string | null;
  product_name?: string | null;
  product_description?: string | null;
}

async function verifyStaffPermission() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Unauthorized: Please log in." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .single();

  const isStaff = ['admin', 'editor', 'developer'].includes((profile as any)?.role) || (profile as any)?.is_admin === true;
  if (!isStaff) {
    return { error: "Forbidden: Staff or Administrator access required." };
  }

  return { success: true, user };
}

export async function updateAdStatus(
  adId: string, 
  newStatus: AdStatus, 
  adminNotes?: string
) {
  const authCheck = await verifyStaffPermission();
  if (authCheck.error) {
    return { error: authCheck.error };
  }

  const supabase = getAdminClient();

  const updateData: any = { 
    status: newStatus,
    updated_at: new Date().toISOString()
  };
  if (adminNotes !== undefined) {
    updateData.admin_notes = adminNotes;
  }

  let { data, error } = await supabase
    .from("advertisements")
    .update(updateData)
    .eq("id", adId)
    .select()
    .single();

  // Schema-adaptive fallback if admin_notes is not in schema cache
  if (error && (error.message?.includes("admin_notes") || (error as any).code === "PGRST204")) {
    const fallback = await supabase
      .from("advertisements")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", adId)
      .select()
      .single();
    error = fallback.error;
    data = fallback.data;
  }

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/admin/ads");
  revalidatePath("/");
  return { success: true, ad: data };
}

export async function configureAndSaveAd(
  adId: string, 
  config: AdConfigurationInput
) {
  const authCheck = await verifyStaffPermission();
  if (authCheck.error) {
    return { error: authCheck.error };
  }

  const supabase = getAdminClient();

  const placement = config.ad_placement || config.ad_type;
  const tier = config.ad_tier || config.package_tier;
  const startDate = config.start_date || config.starts_at;
  const endDate = config.end_date || config.ends_at;

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString()
  };

  if (config.status) updateData.status = config.status;
  if (placement) {
    updateData.ad_placement = placement;
    updateData.ad_type = placement;
  }
  if (tier) {
    updateData.ad_tier = tier;
    updateData.package_tier = tier;
  }
  if (startDate !== undefined) {
    updateData.start_date = startDate;
    updateData.starts_at = startDate;
  }
  if (endDate !== undefined) {
    updateData.end_date = endDate;
    updateData.ends_at = endDate;
  }
  if (config.target_url !== undefined) {
    updateData.target_url = config.target_url ? config.target_url.trim() : null;
  }
  if (config.product_name !== undefined) {
    updateData.product_name = config.product_name ? config.product_name.trim() : null;
  }
  if (config.product_description !== undefined) {
    updateData.product_description = config.product_description ? config.product_description.trim() : null;
  }
  if (config.admin_notes !== undefined) {
    updateData.admin_notes = config.admin_notes ? config.admin_notes.trim() : null;
  }

  let { data, error } = await supabase
    .from("advertisements")
    .update(updateData)
    .eq("id", adId)
    .select()
    .single();

  // Schema-adaptive fallback if optional columns (like product_name or admin_notes) fail in schema cache
  if (error && (error.message?.includes("column") || (error as any).code === "PGRST204")) {
    const safePayload: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    if (config.status) safePayload.status = config.status;
    if (placement) safePayload.ad_type = placement;
    if (tier) safePayload.package_tier = tier;
    if (config.target_url !== undefined) safePayload.target_url = config.target_url;
    if (startDate !== undefined) safePayload.starts_at = startDate;
    if (endDate !== undefined) safePayload.ends_at = endDate;

    const fallback = await supabase
      .from("advertisements")
      .update(safePayload)
      .eq("id", adId)
      .select()
      .single();
    error = fallback.error;
    data = fallback.data;
  }

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/admin/ads");
  revalidatePath("/");
  return { success: true, ad: data };
}
