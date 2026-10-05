import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewJobForm from "@/app/(public)/jobs/new/NewJobForm";

export const metadata = {
  title: "Create Job Posting | Admin",
  description: "Create a job, internship or gig directly on the UPSA opportunities board.",
};

export default async function AdminNewJobPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) redirect("/auth/login?next=/dashboard/admin/jobs/new");

  // Verify Admin Role
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: categories } = await supabase
    .schema("jobs")
    .from("job_categories")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order");

  return <NewJobForm categories={categories ?? []} isAdminMode={true} />;
}
