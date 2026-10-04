import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewJobForm from "./NewJobForm";

export const metadata = {
  title: "Post an Opportunity | Voice of UPSA",
  description: "Submit a job, internship or gig for review on the UPSA opportunities board.",
};

export default async function NewJobPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/jobs/new");

  const { data: categories } = await supabase
    .schema("jobs")
    .from("job_categories")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order");

  return <NewJobForm categories={categories ?? []} />;
}
