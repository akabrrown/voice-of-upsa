import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewJobForm from "@/app/(public)/jobs/new/NewJobForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Job Posting | Admin",
  description: "Edit an existing job posting.",
};

export default async function AdminEditJobPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) redirect(`/auth/login?next=/dashboard/admin/jobs/${slug}/edit`);

  // Verify Admin Role
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

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
    .eq("slug", slug)
    .single();

  if (error || !job) {
    console.error("Job fetch error in edit page:", error);
    notFound();
  }

  return (
    <NewJobForm 
      categories={categories ?? []} 
      isAdminMode={true} 
      initialData={job} 
      jobId={job.id} 
    />
  );
}
