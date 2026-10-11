"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function verifyStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Not authenticated", user: null, supabase };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .single();

  const isStaff = ['admin', 'editor', 'developer'].includes(profile?.role) || profile?.is_admin === true;
  if (!isStaff) return { ok: false, error: "Not authorized", user: null, supabase };

  return { ok: true, user, supabase };
}

export async function updateJobStatus(id: string, status: "approved" | "rejected", reason?: string) {
  const { ok, error: authError, user, supabase } = await verifyStaff();
  if (!ok || !user) return { ok: false, error: authError };

  // Fetch job details for notification & cache revalidation
  const { data: job } = await supabase
    .schema("jobs")
    .from("postings")
    .select("id, title, poster_id, slug")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .schema("jobs")
    .from("postings")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("Failed to update job status:", error);
    return { ok: false, error: "Failed to update job status" };
  }

  // Notify job poster
  if (job?.poster_id) {
    try {
      await supabase.from("notifications").insert({
        recipient_id: job.poster_id,
        type: `job.${status}`,
        category: "jobs",
        payload: {
          job_id: job.id,
          title: job.title,
          status,
          reason: reason?.trim() || null,
          slug: job.slug,
        },
      });
    } catch (notifErr) {
      console.warn("Could not insert job notification:", notifErr);
    }
  }

  revalidatePath("/dashboard/admin/jobs");
  revalidatePath("/jobs");
  if (job?.slug) {
    revalidatePath(`/jobs/${job.slug}`);
  }
  return { ok: true, message: `Job ${status} successfully` };
}

export async function deleteJob(id: string) {
  const { ok, error: authError, supabase } = await verifyStaff();
  if (!ok) return { ok: false, error: authError };

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
  return { ok: true, message: "Job posting deleted" };
}

export async function approveRevision(revisionId: string, postingId: string, changes: any) {
  const { ok, error: authError, user, supabase } = await verifyStaff();
  if (!ok || !user) return { ok: false, error: authError };

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
  return { ok: true, message: "Revision approved and applied" };
}

export async function rejectRevision(revisionId: string, reason?: string) {
  const { ok, error: authError, user, supabase } = await verifyStaff();
  if (!ok || !user) return { ok: false, error: authError };

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
  return { ok: true, message: "Revision rejected" };
}
