import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewJobForm from "@/app/(public)/jobs/new/NewJobForm";
import { Metadata } from "next";

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

  return (
    <NewJobForm 
      categories={categories ?? []} 
      isAdminMode={false} 
      initialData={job} 
      jobId={job.id} 
    />
  );
}
