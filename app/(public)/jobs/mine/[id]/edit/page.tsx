import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewJobForm from "@/app/(public)/jobs/new/NewJobForm";
import { Metadata } from "next";
import { Info } from "lucide-react";

export const metadata: Metadata = {
  title: "Edit Job Posting | Voice of UPSA",
  description: "Edit your job or opportunity posting.",
};

export default async function EditMyJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) redirect(`/auth/login?next=/jobs/mine/${id}/edit`);

  const { data: categories } = await supabase
    .schema("jobs")
    .from("job_categories")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order");

  const { data: job, error } = await supabase
    .schema("jobs")
    .from("postings")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !job) {
    console.error("Job fetch error in edit page:", error);
    notFound();
  }

  // Ensure user owns this job
  if (job.poster_id !== user.id) {
    redirect("/jobs/mine");
  }

  // Fetch any pending revisions
  const { data: revision } = await supabase
    .schema("jobs")
    .from("posting_revisions")
    .select("proposed_changes")
    .eq("posting_id", id)
    .eq("status", "pending")
    .maybeSingle();

  const hasPendingRevision = !!revision;
  const activeData = revision ? { ...job, ...(revision.proposed_changes as object) } : job;

  return (
    <div className="space-y-6">
      {hasPendingRevision && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-800 text-sm">You have pending edits under review</h3>
              <p className="text-amber-700 text-sm mt-1">
                The changes you proposed are currently awaiting admin approval. You can continue editing them here, but your live post will remain unchanged until these edits are approved.
              </p>
            </div>
          </div>
        </div>
      )}
      <NewJobForm 
        categories={categories ?? []} 
        isAdminMode={false} 
        initialData={activeData} 
        jobId={job.id} 
      />
    </div>
  );
}
