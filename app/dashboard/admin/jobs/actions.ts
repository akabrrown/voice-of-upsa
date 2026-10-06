"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateJobStatus(id: string, status: "approved" | "rejected") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { ok: false, error: "Not authorized" };

  const { error } = await supabase
    .schema("jobs")
    .from("postings")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("Failed to update job status:", error);
    return { ok: false, error: "Failed to update job status" };
  }

  revalidatePath("/dashboard/admin/jobs");
  revalidatePath("/jobs");
  return { ok: true };
}

export async function deleteJob(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { ok: false, error: "Not authorized" };

  const { error } = await supabase
    .schema("jobs")
    .from("postings")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Failed to delete job:", error);
    return { ok: false, error: "Failed to delete job" };
  }

  revalidatePath("/dashboard/admin/jobs");
  revalidatePath("/jobs");
  return { ok: true };
}

export async function approveRevision(revisionId: string, postingId: string, changes: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { ok: false, error: "Not authorized" };

  // Because the database trigger intercepts updates based on the user's token, 
  // and we are acting as an admin, the trigger allows this update to pass through.
  const { error: updateError } = await supabase
    .schema("jobs")
    .from("postings")
    .update(changes)
    .eq("id", postingId);

  if (updateError) {
    console.error("Failed to apply revision changes:", updateError);
    return { ok: false, error: "Failed to apply changes." };
  }

  const { error: revError } = await supabase
    .schema("jobs")
    .from("posting_revisions")
    .update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq("id", revisionId);

  if (revError) console.error("Failed to mark revision as approved:", revError);

  revalidatePath("/dashboard/admin/jobs");
  revalidatePath("/jobs");
  return { ok: true };
}

export async function rejectRevision(revisionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { ok: false, error: "Not authorized" };

  const { error } = await supabase
    .schema("jobs")
    .from("posting_revisions")
    .update({ status: "rejected", reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq("id", revisionId);

  if (error) {
    console.error("Failed to reject revision:", error);
    return { ok: false, error: "Failed to reject revision" };
  }

  revalidatePath("/dashboard/admin/jobs");
  return { ok: true };
}
