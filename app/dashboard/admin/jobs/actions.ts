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
